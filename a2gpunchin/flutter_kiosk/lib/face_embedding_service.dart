import 'dart:typed_data';

import 'package:face_detection_tflite/face_detection_tflite.dart';

class FaceEmbeddingService {
  FaceDetector? _detector;

  Future<void> load() async {
    _detector ??= await FaceDetector.create();
  }

  Future<List<double>> embeddingFromImageBytes(Uint8List bytes) async {
    final detector = _detector;
    if (detector == null) {
      throw Exception('Face detector is not ready.');
    }
    final faces = await detector.detectFacesFromBytes(bytes, mode: FaceDetectionMode.full);
    if (faces.isEmpty) {
      throw Exception('No face detected. Please look straight into the camera.');
    }
    if (faces.length > 1) {
      throw Exception('Multiple faces detected. Only one employee should stand in front of the camera.');
    }
    final embedding = await detector.getFaceEmbedding(faces.first, bytes);
    return embedding.map((value) => value.toDouble()).toList();
  }

  void dispose() {
    _detector?.dispose();
    _detector = null;
  }
}
