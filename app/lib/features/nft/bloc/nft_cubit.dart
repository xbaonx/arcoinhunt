import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/network/api_client.dart';

sealed class NFTState {}
class NFTLoading extends NFTState {}
class NFTLoaded extends NFTState { final List<dynamic> items; NFTLoaded(this.items); }
class NFTError extends NFTState { final String message; NFTError(this.message); }

class NFTCubit extends Cubit<NFTState> {
  final ApiClient api;
  NFTCubit(this.api) : super(NFTLoading());

  Future<void> load(String userId, {String? status}) async {
    emit(NFTLoading());
    try {
      final items = await api.userNfts(userId: userId, status: status);
      emit(NFTLoaded(items));
    } catch (e) {
      emit(NFTError('$e'));
    }
  }

  Future<Map<String, dynamic>> transfer({required String userId, required String tokenId, required String wallet}) async {
    return api.transfer(userId: userId, tokenId: tokenId, userWallet: wallet);
  }
}
