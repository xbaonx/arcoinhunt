import 'dart:io';
import 'package:dio/dio.dart';

class ApiClient {
  final Dio _dio;
  ApiClient(this._dio);

  Future<Map<String, dynamic>> health() async {
    final res = await _dio.get('/health');
    return res.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> nearby({required double lat, required double lng, int radius = 100, required String userId}) async {
    final res = await _dio.get('/coins/nearby', queryParameters: {
      'lat': lat,
      'lng': lng,
      'radius': radius,
      'userId': userId,
    });
    return (res.data['items'] as List).cast<dynamic>();
  }

  Future<Map<String, dynamic>> capture({
    required File image,
    required String userId,
    required double lat,
    required double lng,
    required String locationId,
    int radiusMeters = 100,
  }) async {
    final form = FormData.fromMap({
      'image': await MultipartFile.fromFile(image.path, filename: image.uri.pathSegments.last),
      'userId': userId,
      'lat': lat,
      'lng': lng,
      'locationId': locationId,
      'radiusMeters': radiusMeters,
    });
    final res = await _dio.post('/ar/capture', data: form);
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> transfer({ required String userId, required String tokenId, required String userWallet }) async {
    final res = await _dio.post('/nft/transfer', data: {
      'userId': userId,
      'tokenId': tokenId,
      'userWallet': userWallet,
    });
    return res.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> userNfts({ required String userId, String? status }) async {
    final res = await _dio.get('/user/nfts', queryParameters: {
      'userId': userId,
      if (status != null) 'status': status,
    });
    return (res.data['items'] as List).cast<dynamic>();
  }

  Future<Map<String, dynamic>> campaignStatus() async {
    final res = await _dio.get('/campaign/status');
    return res.data as Map<String, dynamic>;
  }
}
