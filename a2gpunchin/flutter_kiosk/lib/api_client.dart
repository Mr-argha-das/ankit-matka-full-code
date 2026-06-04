import 'dart:convert';

import 'package:http/http.dart' as http;

class KioskSession {
  KioskSession({
    required this.branchId,
    required this.branchName,
    required this.tenantId,
    this.companyId,
  });

  final String branchId;
  final String branchName;
  final String tenantId;
  final String? companyId;

  factory KioskSession.fromJson(Map<String, dynamic> json) => KioskSession(
        branchId: json['branch_id'] as String,
        branchName: json['branch_name'] as String,
        tenantId: json['tenant_id'] as String,
        companyId: json['company_id'] as String?,
      );
}

class KioskApiClient {
  KioskApiClient({required this.baseUrl});

  final String baseUrl;

  Uri _uri(String path) {
    final base = baseUrl.trim().replaceAll(RegExp(r'/+$'), '');
    if (base.endsWith('/api') && path.startsWith('/api/')) {
      return Uri.parse('$base${path.substring(4)}');
    }
    return Uri.parse('$base$path');
  }

  Future<KioskSession> login({
    required String branchCode,
    required String kioskPin,
  }) async {
    final response = await http.post(
      _uri('/api/kiosk/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'branch_code': branchCode, 'kiosk_pin': kioskPin}),
    );
    if (response.statusCode != 200) {
      throw Exception(_detail(response));
    }
    return KioskSession.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> facePunch({
    required String branchId,
    required String kioskPin,
    required String action,
    required List<double> faceEmbedding,
  }) async {
    final response = await http.post(
      _uri('/api/kiosk/face-punch'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'branch_id': branchId,
        'kiosk_pin': kioskPin,
        'action': action,
        'face_embedding': faceEmbedding,
        'device_info': 'flutter-kiosk',
      }),
    );
    if (response.statusCode != 200) {
      throw Exception(_detail(response));
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> enrollFace({
    required String branchId,
    required String kioskPin,
    required String employeeCode,
    required List<double> faceEmbedding,
  }) async {
    final response = await http.post(
      _uri('/api/kiosk/enroll-face'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'branch_id': branchId,
        'kiosk_pin': kioskPin,
        'employee_code': employeeCode,
        'face_embedding': faceEmbedding,
      }),
    );
    if (response.statusCode != 200) {
      throw Exception(_detail(response));
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  String _detail(http.Response response) {
    final contentType = response.headers['content-type'] ?? '';
    final bodyText = response.body.trim();
    if (contentType.contains('text/html') || bodyText.startsWith('<!doctype html') || bodyText.startsWith('<html')) {
      return 'Backend returned a web page instead of API JSON. Check Backend URL, port, and make sure the FastAPI server is running.';
    }
    try {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      return body['detail']?.toString() ?? response.body;
    } catch (_) {
      if (bodyText.length > 180) {
        return '${bodyText.substring(0, 180)}...';
      }
      return bodyText.isEmpty ? 'Request failed with status ${response.statusCode}' : bodyText;
    }
  }
}
