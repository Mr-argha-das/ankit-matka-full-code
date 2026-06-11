import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';

const webAppUrl = String.fromEnvironment(
  'WEB_APP_URL',
  defaultValue: 'https://game.natraj777.com/login',
);

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MatkaApp());
}

class MatkaApp extends StatelessWidget {
  const MatkaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Natarj 777',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF79049A),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const MatkaWebView(),
    );
  }
}

class MatkaWebView extends StatefulWidget {
  const MatkaWebView({super.key});

  @override
  State<MatkaWebView> createState() => _MatkaWebViewState();
}

class _MatkaWebViewState extends State<MatkaWebView> {
  static const _upiChannel = MethodChannel('matka/upi_intent');

  late final WebViewController _controller;
  var _progress = 0;
  var _hasError = false;

  @override
  void initState() {
    super.initState();

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..addJavaScriptChannel(
        'StartUpiPayment',
        onMessageReceived: _startUpiPayment,
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) => setState(() => _progress = progress),
          onPageStarted: (_) => setState(() => _hasError = false),
          onWebResourceError: (error) {
            if (error.isForMainFrame == true) {
              setState(() => _hasError = true);
            }
          },
          onNavigationRequest: (request) {
            if (request.url.startsWith('upi://')) {
              _openUpiLink({'upi_link': request.url});
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(webAppUrl));
  }

  Future<void> _startUpiPayment(JavaScriptMessage message) async {
    try {
      final payload = jsonDecode(message.message) as Map<String, dynamic>;
      await _openUpiLink(payload);
    } catch (error) {
      await _sendUpiResult({
        'status': 'FAILED',
        'error': 'Invalid payment payload',
        'raw': error.toString(),
      });
    }
  }

  Future<void> _openUpiLink(Map<String, dynamic> payload) async {
    try {
      final result = await _upiChannel.invokeMethod<String>(
        'startPayment',
        payload,
      );

      if (result == null || result.isEmpty) {
        await _sendUpiResult({
          'status': 'PENDING',
          'raw': 'UPI app did not return a response',
        });
        return;
      }

      await _sendUpiResult(result);
    } on PlatformException catch (error) {
      await _sendUpiResult({
        'status': 'FAILED',
        'error': error.message ?? error.code,
        'raw': error.details?.toString(),
      });
    }
  }

  Future<void> _sendUpiResult(Object result) async {
    final encoded = jsonEncode(result);
    await _controller.runJavaScript(
      'window.handleUpiPaymentResult && window.handleUpiPaymentResult($encoded);',
    );
  }

  Future<bool> _handleBack() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final shouldPop = await _handleBack();
        if (shouldPop && context.mounted) {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          child: Stack(
            children: [
              if (_hasError) _ErrorView(onRetry: () => _controller.reload()),
              if (!_hasError) WebViewWidget(controller: _controller),
              if (_progress < 100)
                LinearProgressIndicator(
                  value: _progress / 100,
                  minHeight: 2,
                  color: const Color(0xFFB00FDC),
                  backgroundColor: Colors.black,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off, size: 44, color: Colors.white70),
            const SizedBox(height: 16),
            const Text(
              'Website load nahi ho paayi.',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              webAppUrl,
              style: const TextStyle(color: Colors.white54),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: onRetry,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
