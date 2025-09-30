import 'package:dio/dio.dart';
import 'package:get_it/get_it.dart';
import '../config/app_config.dart';
import '../network/api_client.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../features/auth/user_id_service.dart';

final sl = GetIt.instance;

Future<void> setupInjector() async {
  final dio = Dio(BaseOptions(
    baseUrl: AppConfig.apiBaseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 20),
    sendTimeout: const Duration(seconds: 20),
    headers: {
      'Accept': 'application/json',
    },
  ));
  sl.registerSingleton<Dio>(dio);
  sl.registerLazySingleton<ApiClient>(() => ApiClient(sl()));
  sl.registerLazySingleton<FlutterSecureStorage>(() => const FlutterSecureStorage());
  sl.registerLazySingleton<UserIdService>(() => UserIdService(sl()));
}
