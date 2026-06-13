import 'dart:async';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_client.dart';
import 'face_embedding_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  final cameras = await availableCameras();
  runApp(AttendanceKioskApp(cameras: cameras));
}

class AttendanceKioskApp extends StatelessWidget {
  const AttendanceKioskApp(
      {super.key, required this.cameras, this.enableFaceService = true});

  final List<CameraDescription> cameras;
  final bool enableFaceService;

  @override
  Widget build(BuildContext context) {
    const primary = Color(0xFF21185F);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'rMatrix',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: primary,
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xFFF4F7FB),
        useMaterial3: true,
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(18)),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(18),
            borderSide: const BorderSide(color: Color(0xFFD8E0EF)),
          ),
        ),
      ),
      home: KioskShell(cameras: cameras, enableFaceService: enableFaceService),
    );
  }
}

enum KioskPage { scanner, enroll, settings }

class KioskShell extends StatefulWidget {
  const KioskShell(
      {super.key, required this.cameras, this.enableFaceService = true});

  final List<CameraDescription> cameras;
  final bool enableFaceService;

  @override
  State<KioskShell> createState() => _KioskShellState();
}

class _KioskShellState extends State<KioskShell> {
  final _baseUrlController =
      TextEditingController(text: 'https://b3a8-103-87-58-12.ngrok-free.app');
  final _branchCodeController = TextEditingController(text: 'AHIT');
  final _pinController = TextEditingController(text: '1234');
  final _employeeCodeController = TextEditingController();
  final _faceService = FaceEmbeddingService();
  final _tts = FlutterTts();

  CameraController? _camera;
  KioskApiClient? _client;
  KioskSession? _session;
  KioskPage _page = KioskPage.settings;
  bool _busy = false;
  bool _autoScan = false;
  String _message = 'Connect kiosk from settings.';
  Timer? _scanTimer;
  Timer? _cooldownTimer;
  DateTime? _cooldownUntil;

  @override
  void initState() {
    super.initState();
    if (widget.enableFaceService) {
      _faceService.load();
    }
    _configureVoice();
    _restore();
    _initCamera();
  }

  Future<void> _configureVoice() async {
    await _tts.setLanguage('en-IN');
    await _tts.setSpeechRate(0.46);
    await _tts.setPitch(1.0);
  }

  Future<void> _restore() async {
    final prefs = await SharedPreferences.getInstance();
    _baseUrlController.text =
        prefs.getString('base_url') ?? _baseUrlController.text;
    _branchCodeController.text =
        prefs.getString('branch_code') ?? _branchCodeController.text;
    _pinController.text = prefs.getString('kiosk_pin') ?? _pinController.text;
    final hasSavedSetup = prefs.containsKey('base_url') &&
        prefs.containsKey('branch_code') &&
        prefs.containsKey('kiosk_pin');
    if (hasSavedSetup) {
      await _startKiosk(silent: true);
    }
  }

  Future<void> _initCamera() async {
    if (widget.cameras.isEmpty) {
      _setMessage('Camera not found on this device.');
      return;
    }
    final frontCamera = widget.cameras.firstWhere(
      (camera) => camera.lensDirection == CameraLensDirection.front,
      orElse: () => widget.cameras.first,
    );
    final controller = CameraController(frontCamera, ResolutionPreset.high,
        enableAudio: false);
    await controller.initialize();
    if (!mounted) return;
    setState(() => _camera = controller);
  }

  void _setMessage(String message) {
    if (!mounted) return;
    setState(() => _message = message);
  }

  void _openPage(KioskPage page) {
    setState(() => _page = page);
    if (page == KioskPage.scanner && _session != null) {
      _startAutoScan();
    } else {
      _stopAutoScan();
    }
  }

  String _normalizedBaseUrl() {
    final raw = _baseUrlController.text.trim();
    if (raw.isEmpty) {
      throw Exception('Enter backend URL first.');
    }
    final withScheme = raw.startsWith('http://') || raw.startsWith('https://')
        ? raw
        : 'http://$raw';
    return withScheme.replaceAll(RegExp(r'/+$'), '');
  }

  Future<void> _startKiosk({bool silent = false}) async {
    setState(() {
      _busy = true;
      _message = 'Connecting kiosk...';
    });
    try {
      final backendUrl = _normalizedBaseUrl();
      _baseUrlController.text = backendUrl;
      final client = KioskApiClient(baseUrl: backendUrl);
      final session = await client.login(
        branchCode: _branchCodeController.text.trim(),
        kioskPin: _pinController.text.trim(),
      );
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('base_url', backendUrl);
      await prefs.setString('branch_code', _branchCodeController.text.trim());
      await prefs.setString('kiosk_pin', _pinController.text.trim());
      setState(() {
        _client = client;
        _session = session;
        _page = KioskPage.scanner;
        _message = 'Ready at ${session.branchName}.';
      });
      if (!silent) {
        _toast('Kiosk ready at ${session.branchName}', success: true);
        await _speak('Kiosk ready');
      }
      _startAutoScan();
    } catch (error) {
      _toast(error.toString(), success: false);
      _setMessage(error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _startAutoScan() {
    if (_autoScan) return;
    _autoScan = true;
    _scanTimer?.cancel();
    _scanTimer =
        Timer.periodic(const Duration(seconds: 3), (_) => _scanAndPunch());
    Future<void>.delayed(const Duration(milliseconds: 600), _scanAndPunch);
  }

  void _stopAutoScan() {
    _autoScan = false;
    _scanTimer?.cancel();
    _scanTimer = null;
  }

  int get _cooldownRemainingSeconds {
    final until = _cooldownUntil;
    if (until == null) return 0;
    final remaining = until.difference(DateTime.now()).inSeconds + 1;
    return remaining > 0 ? remaining : 0;
  }

  bool get _inScanCooldown => _cooldownRemainingSeconds > 0;

  void _startScanCooldown(String successMessage) {
    _cooldownTimer?.cancel();
    _cooldownUntil = DateTime.now().add(const Duration(seconds: 10));
    void tick() {
      final remaining = _cooldownRemainingSeconds;
      if (remaining <= 0) {
        _cooldownTimer?.cancel();
        _cooldownTimer = null;
        _cooldownUntil = null;
        _setMessage('Ready for next face scan.');
        return;
      }
      _setMessage('$successMessage Next scan in ${remaining}s.');
    }

    tick();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (_) => tick());
  }

  Future<List<double>> _captureEmbedding() async {
    final camera = _camera;
    if (camera == null || !camera.value.isInitialized) {
      throw Exception('Camera is not ready.');
    }
    await _faceService.load();
    final file = await camera.takePicture();
    final bytes = await File(file.path).readAsBytes();
    return _faceService.embeddingFromImageBytes(bytes);
  }

  Future<void> _scanAndPunch() async {
    if (!_autoScan || _busy || _page != KioskPage.scanner) return;
    if (_inScanCooldown) {
      _setMessage(
          'Please wait ${_cooldownRemainingSeconds}s before next face scan.');
      return;
    }
    final client = _client;
    final session = _session;
    if (client == null || session == null) {
      _setMessage('Open Settings and start kiosk first.');
      return;
    }
    setState(() {
      _busy = true;
      _message = 'Scanning face...';
    });
    try {
      final embedding = await _captureEmbedding();
      final result = await client.facePunch(
        branchId: session.branchId,
        kioskPin: _pinController.text.trim(),
        action: 'auto',
        faceEmbedding: embedding,
      );
      final name = result['employee_name']?.toString() ?? 'Employee';
      final firstName = name.split(' ').first;
      final didPunchOut = result['action'] == 'punch_out';
      final message = didPunchOut
          ? 'Punch out successful. Thank you $firstName.'
          : 'Punch in successful. Thank you $firstName.';
      _toast(message, success: true);
      await _speak(message);
      _startScanCooldown(message);
    } catch (error) {
      final message = error.toString().replaceFirst('Exception: ', '');
      if (!message.toLowerCase().contains('no face')) {
        _toast(message, success: false);
      }
      _setMessage(message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _enrollFace() async {
    final client = _client;
    final session = _session;
    final employeeCode = _employeeCodeController.text.trim();
    if (employeeCode.isEmpty) {
      _toast('Enter employee code.', success: false);
      return;
    }
    if (client == null || session == null) {
      _toast('Start kiosk from settings first.', success: false);
      return;
    }
    setState(() {
      _busy = true;
      _message = 'Capturing enrollment face...';
    });
    try {
      final embedding = await _captureEmbedding();
      final result = await client.enrollFace(
        branchId: session.branchId,
        kioskPin: _pinController.text.trim(),
        employeeCode: employeeCode,
        faceEmbedding: embedding,
      );
      final name = result['employee_name']?.toString() ?? employeeCode;
      _employeeCodeController.clear();
      _toast('Face enrolled for $name', success: true);
      await _speak('Face enrolled for ${name.split(' ').first}');
      _setMessage('Face enrolled for $name.');
    } catch (error) {
      _toast(error.toString(), success: false);
      _setMessage(error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _toast(String message, {required bool success}) {
    Fluttertoast.showToast(
      msg: message,
      toastLength: Toast.LENGTH_LONG,
      gravity: ToastGravity.TOP,
      backgroundColor:
          success ? const Color(0xFF0F766E) : const Color(0xFFDC2626),
      textColor: Colors.white,
      fontSize: 16,
    );
  }

  Future<void> _speak(String message) async {
    await _tts.stop();
    await _tts.speak(message);
  }

  @override
  void dispose() {
    _stopAutoScan();
    _cooldownTimer?.cancel();
    _camera?.dispose();
    _faceService.dispose();
    _tts.stop();
    _baseUrlController.dispose();
    _branchCodeController.dispose();
    _pinController.dispose();
    _employeeCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.sizeOf(context).width >= 760;
    return Scaffold(
      body: Row(
        children: [
          if (isWide) _Sidebar(state: this),
          Expanded(child: _pageBody()),
        ],
      ),
      bottomNavigationBar: isWide ? null : _BottomNav(state: this),
    );
  }

  Widget _pageBody() {
    return switch (_page) {
      KioskPage.scanner => _ScannerPage(state: this),
      KioskPage.enroll => _EnrollPage(state: this),
      KioskPage.settings => _SettingsPage(state: this),
    };
  }
}

class _Sidebar extends StatelessWidget {
  const _Sidebar({required this.state});

  final _KioskShellState state;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 260,
      padding: const EdgeInsets.fromLTRB(18, 22, 18, 18),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0B1020), Color(0xFF111846)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14)),
                child: const Center(
                    child: Text('RM',
                        style: TextStyle(
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF21185F)))),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('rMatrix',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w900)),
                    Text('Face punch console',
                        style:
                            TextStyle(color: Color(0xFFAAB2D5), fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),
          _NavItem(
              icon: Icons.face_retouching_natural,
              label: 'Punch Scanner',
              selected: state._page == KioskPage.scanner,
              onTap: () => state._openPage(KioskPage.scanner)),
          _NavItem(
              icon: Icons.person_add_alt_1,
              label: 'Enroll Face',
              selected: state._page == KioskPage.enroll,
              onTap: () => state._openPage(KioskPage.enroll)),
          _NavItem(
              icon: Icons.settings,
              label: 'Settings',
              selected: state._page == KioskPage.settings,
              onTap: () => state._openPage(KioskPage.settings)),
          const Spacer(),
          _StatusPill(session: state._session),
        ],
      ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  const _BottomNav({required this.state});

  final _KioskShellState state;

  @override
  Widget build(BuildContext context) {
    return NavigationBar(
      selectedIndex: state._page.index,
      onDestinationSelected: (index) =>
          state._openPage(KioskPage.values[index]),
      destinations: const [
        NavigationDestination(
            icon: Icon(Icons.face_retouching_natural), label: 'Punch'),
        NavigationDestination(
            icon: Icon(Icons.person_add_alt_1), label: 'Enroll'),
        NavigationDestination(icon: Icon(Icons.settings), label: 'Settings'),
      ],
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem(
      {required this.icon,
      required this.label,
      required this.selected,
      required this.onTap});

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          decoration: BoxDecoration(
            color: selected ? const Color(0xFF1C2553) : Colors.transparent,
            borderRadius: BorderRadius.circular(14),
            border: selected
                ? const Border(
                    left: BorderSide(color: Color(0xFF7DD3FC), width: 4))
                : null,
          ),
          child: Row(
            children: [
              Icon(icon, color: Colors.white, size: 22),
              const SizedBox(width: 12),
              Text(label,
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w800)),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.session});

  final KioskSession? session;

  @override
  Widget build(BuildContext context) {
    final ready = session != null;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ready
            ? const Color(0xFFECFDF5)
            : Colors.white.withValues(alpha: .08),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Text(
        ready ? 'Ready at ${session!.branchName}' : 'Kiosk not started',
        style: TextStyle(
            color: ready ? const Color(0xFF047857) : Colors.white,
            fontWeight: FontWeight.w800),
      ),
    );
  }
}

class _ScannerPage extends StatelessWidget {
  const _ScannerPage({required this.state});

  final _KioskShellState state;

  @override
  Widget build(BuildContext context) {
    final camera = state._camera;
    return Stack(
      fit: StackFit.expand,
      children: [
        if (camera != null && camera.value.isInitialized)
          FittedBox(
            fit: BoxFit.cover,
            child: SizedBox(
              width: camera.value.previewSize?.height ?? 1080,
              height: camera.value.previewSize?.width ?? 1920,
              child: CameraPreview(camera),
            ),
          )
        else
          const ColoredBox(
            color: Color(0xFF0B1020),
            child:
                Center(child: CircularProgressIndicator(color: Colors.white)),
          ),
        const _ScannerScrim(),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    _GlassChip(
                        icon: Icons.apartment,
                        label: state._session?.branchName ??
                            'Start kiosk from settings'),
                    const Spacer(),
                    const _GlassChip(
                        icon: Icons.autorenew, label: 'Auto Punch'),
                  ],
                ),
                const Spacer(),
                Center(
                  child: Container(
                    width: 270,
                    height: 330,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.white, width: 3),
                      borderRadius: BorderRadius.circular(150),
                    ),
                    child: const Align(
                      alignment: Alignment.bottomCenter,
                      child: Padding(
                        padding: EdgeInsets.only(bottom: 24),
                        child: Text('Place face here',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.w900)),
                      ),
                    ),
                  ),
                ),
                const Spacer(),
                _MessageBanner(message: state._message, busy: state._busy),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ScannerScrim extends StatelessWidget {
  const _ScannerScrim();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.black.withValues(alpha: .62),
            Colors.transparent,
            Colors.black.withValues(alpha: .7)
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
    );
  }
}

class _GlassChip extends StatelessWidget {
  const _GlassChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: .36),
          borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 18),
          const SizedBox(width: 8),
          Text(label,
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

class _MessageBanner extends StatelessWidget {
  const _MessageBanner({required this.message, required this.busy});

  final String message;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          boxShadow: const [
            BoxShadow(color: Color(0x33000000), blurRadius: 30)
          ]),
      child: Row(
        children: [
          if (busy) ...[
            const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 3)),
            const SizedBox(width: 12),
          ] else ...[
            const Icon(Icons.center_focus_strong, color: Color(0xFF21185F)),
            const SizedBox(width: 12),
          ],
          Expanded(
              child: Text(message,
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w800))),
        ],
      ),
    );
  }
}

class _EnrollPage extends StatelessWidget {
  const _EnrollPage({required this.state});

  final _KioskShellState state;

  @override
  Widget build(BuildContext context) {
    final camera = state._camera;
    return _PageScaffold(
      title: 'Enroll Face',
      subtitle:
          'Register employee face once. After enrollment the kiosk can auto punch in and out.',
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isCompact = constraints.maxWidth < 720;
          if (isCompact) {
            return SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(
                      height: 420,
                      child: _CameraCard(
                          camera: camera,
                          hint: 'Ask employee to look straight')),
                  const SizedBox(height: 16),
                  _EnrollFormCard(state: state),
                ],
              ),
            );
          }
          return Row(
            children: [
              Expanded(
                flex: 5,
                child: _CameraCard(
                    camera: camera, hint: 'Ask employee to look straight'),
              ),
              const SizedBox(width: 18),
              Expanded(flex: 4, child: _EnrollFormCard(state: state)),
            ],
          );
        },
      ),
    );
  }
}

class _EnrollFormCard extends StatelessWidget {
  const _EnrollFormCard({required this.state});

  final _KioskShellState state;

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('Employee Enrollment',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
          const SizedBox(height: 8),
          Text('Enter employee code from admin panel, then capture face.',
              style: TextStyle(color: Colors.grey.shade700, height: 1.35)),
          const SizedBox(height: 22),
          TextField(
            controller: state._employeeCodeController,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(
                labelText: 'Employee Code',
                prefixIcon: Icon(Icons.badge_outlined)),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 52,
            child: FilledButton.icon(
              onPressed: state._busy ? null : state._enrollFace,
              icon: const Icon(Icons.face_retouching_natural),
              label: const FittedBox(
                  fit: BoxFit.scaleDown, child: Text('Capture & Enroll Face')),
            ),
          ),
          const SizedBox(height: 16),
          Text(state._message,
              style:
                  const TextStyle(fontWeight: FontWeight.w700, height: 1.35)),
        ],
      ),
    );
  }
}

class _SettingsPage extends StatelessWidget {
  const _SettingsPage({required this.state});

  final _KioskShellState state;

  @override
  Widget build(BuildContext context) {
    return _PageScaffold(
      title: 'Kiosk Settings',
      subtitle:
          'Start this TL phone from any kiosk branch. After that, any enrolled employee in the company can punch here.',
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 760),
          child: _SurfaceCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Connection',
                    style:
                        TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
                const SizedBox(height: 18),
                TextField(
                  controller: state._baseUrlController,
                  keyboardType: TextInputType.url,
                  textInputAction: TextInputAction.next,
                  autocorrect: false,
                  enableSuggestions: false,
                  decoration: const InputDecoration(
                    labelText: 'Backend URL',
                    hintText: 'http://192.168.1.10:8001',
                    helperText:
                        'Use your server IP and port. http:// is added automatically if missing.',
                    prefixIcon: Icon(Icons.link),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                    controller: state._branchCodeController,
                    decoration: const InputDecoration(
                        labelText: 'Branch Code',
                        prefixIcon: Icon(Icons.apartment))),
                const SizedBox(height: 12),
                TextField(
                    controller: state._pinController,
                    obscureText: true,
                    decoration: const InputDecoration(
                        labelText: 'Kiosk PIN', prefixIcon: Icon(Icons.pin))),
                const SizedBox(height: 18),
                FilledButton.icon(
                  onPressed: state._busy ? null : state._startKiosk,
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: const Text('Start Kiosk'),
                ),
                const SizedBox(height: 14),
                Text(state._message,
                    style: const TextStyle(fontWeight: FontWeight.w700)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PageScaffold extends StatelessWidget {
  const _PageScaffold(
      {required this.title, required this.subtitle, required this.child});

  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).width < 520;
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.all(compact ? 20 : 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title,
                style: TextStyle(
                    fontSize: compact ? 28 : 32, fontWeight: FontWeight.w900)),
            const SizedBox(height: 6),
            Text(subtitle,
                style: TextStyle(
                    color: Colors.grey.shade700,
                    fontWeight: FontWeight.w600,
                    height: 1.35)),
            SizedBox(height: compact ? 18 : 22),
            Expanded(child: child),
          ],
        ),
      ),
    );
  }
}

class _SurfaceCard extends StatelessWidget {
  const _SurfaceCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).width < 520;
    return Container(
      padding: EdgeInsets.all(compact ? 20 : 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(compact ? 22 : 28),
        border: Border.all(color: const Color(0xFFD8E0EF)),
        boxShadow: const [
          BoxShadow(
              color: Color(0x110F172A), blurRadius: 28, offset: Offset(0, 18))
        ],
      ),
      child: child,
    );
  }
}

class _CameraCard extends StatelessWidget {
  const _CameraCard({required this.camera, required this.hint});

  final CameraController? camera;
  final String hint;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final ovalWidth = constraints.maxWidth.clamp(190.0, 250.0);
          final ovalHeight = (constraints.maxHeight * .62).clamp(230.0, 320.0);
          return Stack(
            fit: StackFit.expand,
            children: [
              if (camera != null && camera!.value.isInitialized)
                FittedBox(
                  fit: BoxFit.cover,
                  child: SizedBox(
                    width: camera!.value.previewSize?.height ?? 1080,
                    height: camera!.value.previewSize?.width ?? 1920,
                    child: CameraPreview(camera!),
                  ),
                )
              else
                const ColoredBox(
                  color: Color(0xFF0B1020),
                  child: Center(
                      child: CircularProgressIndicator(color: Colors.white)),
                ),
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: .72)
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
              Center(
                child: Container(
                  width: ovalWidth,
                  height: ovalHeight,
                  decoration: BoxDecoration(
                      border: Border.all(color: Colors.white, width: 3),
                      borderRadius: BorderRadius.circular(160)),
                ),
              ),
              Positioned(
                left: 18,
                right: 18,
                bottom: 18,
                child: Text(hint,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        height: 1.25)),
              ),
            ],
          );
        },
      ),
    );
  }
}
