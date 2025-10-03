import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import '../../../core/network/api_client.dart';
import '../bloc/nft_cubit.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/config/app_config.dart';

class NftListPage extends StatefulWidget {
  const NftListPage({super.key});

  @override
  State<NftListPage> createState() => _NftListPageState();
}

class _NftListPageState extends State<NftListPage> with SingleTickerProviderStateMixin {
  late final TabController ctrl;
  final userId = 'demo-user';

  @override
  void initState() {
    super.initState();
    ctrl = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: BlocProvider(
        create: (_) => NFTCubit(GetIt.I<ApiClient>())..load(userId, status: 'reserved'),
        child: Builder(
          builder: (context) => Scaffold(
            appBar: AppBar(
              title: const Text('My NFTs'),
              bottom: TabBar(
                controller: ctrl,
                tabs: const [Tab(text: 'Reserved'), Tab(text: 'In Wallet')],
                onTap: (i) => context
                    .read<NFTCubit>()
                    .load(userId, status: i == 0 ? 'reserved' : 'transferred'),
              ),
            ),
            body: TabBarView(
              controller: ctrl,
              children: [
                _List(status: 'reserved', userId: userId),
                _List(status: 'transferred', userId: userId),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openOpenSea(dynamic tokenId) async {
    final url = '${AppConfig.openSeaBase}/${AppConfig.contractAddress}/$tokenId';
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}

class _List extends StatelessWidget {
  final String status;
  final String userId;
  const _List({required this.status, required this.userId});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<NFTCubit, NFTState>(
      builder: (context, state) {
        if (state is NFTLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is NFTError) {
          return Center(child: Text(state.message));
        }
        final items = (state as NFTLoaded).items;
        if (items.isEmpty) return const Center(child: Text('No items'));
        return ListView.separated(
          itemCount: items.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (context, i) {
            final it = items[i] as Map<String, dynamic>;
            return ListTile(
              title: Text('#${it['token_id']}'),
              subtitle: Text(it['token_uri'] ?? ''),
              trailing: status == 'reserved'
                  ? FilledButton(
                      onPressed: () async {
                        final wallet = await _askWallet(context);
                        if (wallet == null) return;
                        final res = await context.read<NFTCubit>().transfer(userId: userId, tokenId: it['token_id'].toString(), wallet: wallet);
                        // ignore: use_build_context_synchronously
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Transfer: ${res['txHash']}')));
                        // ignore: use_build_context_synchronously
                        context.read<NFTCubit>().load(userId, status: 'reserved');
                      },
                      child: const Text('Transfer'))
                  : TextButton(
                      onPressed: () async {
                        final url = '${AppConfig.openSeaBase}/${AppConfig.contractAddress}/${it['token_id']}';
                        final uri = Uri.parse(url);
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(uri, mode: LaunchMode.externalApplication);
                        }
                      },
                      child: const Text('OpenSea'),
                    ),
            );
          },
        );
      },
    );
  }

  Future<String?> _askWallet(BuildContext context) async {
    final ctrl = TextEditingController();
    return await showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Your wallet'),
        content: TextField(controller: ctrl, decoration: const InputDecoration(hintText: '0x...')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, ctrl.text), child: const Text('OK')),
        ],
      ),
    );
  }
}
