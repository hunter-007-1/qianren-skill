import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:typed_data';
import 'models.dart';
import 'auth_service.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';

Widget _buildAvatar(String? url, double radius, {Widget? fallback}) {
  if (url == null || url.isEmpty) {
    return fallback ?? CircleAvatar(radius: radius, backgroundColor: Colors.indigo.shade100);
  }
  try {
    if (url.startsWith('data:')) {
      final base64Str = url.split(',').last;
      final bytes = base64Decode(base64Str);
      return ClipOval(
        child: Image.memory(bytes, width: radius * 2, height: radius * 2, fit: BoxFit.cover),
      );
    }
    return ClipOval(
      child: Image.network(url, width: radius * 2, height: radius * 2, fit: BoxFit.cover),
    );
  } catch (_) {
    return fallback ?? CircleAvatar(radius: radius, backgroundColor: Colors.indigo.shade100);
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiClient.init();

  // 如果没有 token，直接显示登录页面，跳过 checkAuth()
  if (ApiClient.token == null) {
    AuthService.isLoading = false;
    runApp(const MyApp());
    return;
  }

  // 有 token，启动 app 并后台验证
  runApp(const MyApp());
  AuthService.checkAuth();
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  static final ValueNotifier<ThemeMode> themeNotifier = ValueNotifier(ThemeMode.light);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    AuthService.onAuthChecked = () {
      if (mounted) setState(() {});
    };
  }

  @override
  void dispose() {
    AuthService.onAuthChecked = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: MyApp.themeNotifier,
      builder: (context, mode, _) {
        return MaterialApp(
          title: '千人智聊',
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
            useMaterial3: true,
            brightness: Brightness.light,
          ),
          darkTheme: ThemeData(
            colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo, brightness: Brightness.dark),
            useMaterial3: true,
            brightness: Brightness.dark,
          ),
          themeMode: mode,
          home: AuthService.isLoading
              ? const LoadingScreen()
              : AuthService.currentUser != null
                  ? const MainScreen()
                  : const LoginScreen(),
        );
      },
    );
  }
}

class LoadingScreen extends StatelessWidget {
  const LoadingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  List<RecentAccount> _recentAccounts = [];

  @override
  void initState() {
    super.initState();
    _loadRecentAccounts();
  }

  void _loadRecentAccounts() async {
    final accounts = await AuthService.getRecentAccounts();
    if (mounted) setState(() => _recentAccounts = accounts);
  }

  void _switchToAccount(RecentAccount account) async {
    setState(() => _isLoading = true);
    final success = await AuthService.switchAccount(account);
    setState(() => _isLoading = false);
    if (!mounted) return;
    if (success) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const MainScreen()));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('账号已失效，请重新登录')),
      );
      _loadRecentAccounts();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 60),
            const Row(
              children: [
                Icon(Icons.auto_awesome, size: 40, color: Colors.indigo),
                SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('登录', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    Text('QIANREN', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 40),
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: '邮箱', border: OutlineInputBorder()),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(labelText: '密码', border: OutlineInputBorder()),
              obscureText: true,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _handleLogin,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigo,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isLoading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('登录', style: TextStyle(fontSize: 16)),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
              child: const Text('没有账号？去注册'),
            ),
            TextButton(
              onPressed: _showServerSettings,
              child: Text('服务器设置', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
            ),
            if (_recentAccounts.isNotEmpty) ...[
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(child: Divider(color: Colors.grey.shade300)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text('最近登录', style: TextStyle(fontSize: 13, color: Colors.grey.shade500)),
                  ),
                  Expanded(child: Divider(color: Colors.grey.shade300)),
                ],
              ),
              const SizedBox(height: 16),
              ..._recentAccounts.map((account) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: InkWell(
                  onTap: _isLoading ? null : () => _switchToAccount(account),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade200),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: Colors.indigo.shade100,
                          child: Text(
                            (account.nickname ?? account.email)[0].toUpperCase(),
                            style: TextStyle(color: Colors.indigo.shade700, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                account.nickname ?? account.email,
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                              ),
                              if (account.nickname != null)
                                Text(account.email, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                            ],
                          ),
                        ),
                        Icon(Icons.chevron_right, color: Colors.grey.shade400),
                      ],
                    ),
                  ),
                ),
              )),
            ],
          ],
        ),
      ),
    );
  }

  void _handleLogin() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请输入邮箱和密码')));
      return;
    }
    setState(() => _isLoading = true);
    final error = await AuthService.login(_emailController.text, _passwordController.text);
    setState(() => _isLoading = false);
    if (error == null && mounted) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const MainScreen()));
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(error ?? '登录失败'),
        backgroundColor: Colors.red,
      ));
    }
  }

  void _showServerSettings() async {
    final currentUrl = await ApiConstants.getBaseUrl();
    final controller = TextEditingController(text: currentUrl);

    if (!mounted) return;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('服务器设置'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: '服务器地址',
            hintText: 'https://wzhs.ccwu.cc',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () async {
              await ApiConstants.resetBaseUrl();
              if (ctx.mounted) {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('已恢复默认地址，重启 App 生效')),
                );
              }
            },
            child: const Text('恢复默认', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              final url = controller.text.trim();
              if (url.isEmpty) return;
              final normalized = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
              await ApiConstants.setBaseUrl(normalized);
              if (ctx.mounted) {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('服务器地址已更新，重启 App 生效')),
                );
              }
            },
            child: const Text('保存'),
          ),
        ],
      ),
    );
  }
}

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nicknameController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('注册')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            TextField(
              controller: _nicknameController,
              decoration: const InputDecoration(labelText: '昵称（可选）', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: '邮箱', border: OutlineInputBorder()),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(labelText: '密码', border: OutlineInputBorder()),
              obscureText: true,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _handleRegister,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigo,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isLoading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('注册'),
            ),
          ],
        ),
      ),
    );
  }

  void _handleRegister() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请输入邮箱和密码')));
      return;
    }
    setState(() => _isLoading = true);
    final error = await AuthService.register(
      _emailController.text,
      _passwordController.text,
      _nicknameController.text.isEmpty ? null : _nicknameController.text,
    );
    setState(() => _isLoading = false);
    if (error == null && mounted) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const MainScreen()));
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(error ?? '注册失败'),
        backgroundColor: Colors.red,
      ));
    }
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const CreateScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (i) {
          if (i == 1) {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateScreen())).then((_) {
              setState(() => _selectedIndex = 0);
            });
          } else {
            setState(() => _selectedIndex = i);
          }
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: '首页'),
          NavigationDestination(icon: Icon(Icons.add_circle), label: '创建'),
          NavigationDestination(icon: Icon(Icons.person), label: '我的'),
        ],
      ),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Character> _characters = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    loadCharacters();
  }

  void loadCharacters() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient.get('/api/characters');
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        setState(() => _characters = data.map((c) => Character.fromJson(c)).toList());
      }
    } catch (_) {}
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final hasRunningAnalysis = _characters.any((c) => c.analysisStatus == 'RUNNING');

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.auto_awesome, color: Colors.indigo),
            SizedBox(width: 8),
            Text('千人智聊'),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(MyApp.themeNotifier.value == ThemeMode.dark ? Icons.light_mode : Icons.dark_mode),
            onPressed: () {
              MyApp.themeNotifier.value =
                  MyApp.themeNotifier.value == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
            },
          ),
          if (AuthService.currentUser?.isAdmin == true)
            IconButton(
              icon: const Icon(Icons.admin_panel_settings),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminScreen())),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _characters.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: () async => loadCharacters(),
                  child: ListView.builder(
                    itemCount: _characters.length,
                    itemBuilder: (context, index) => _buildCharacterCard(_characters[index]),
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateScreen())).then((_) => loadCharacters()),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.auto_awesome, size: 64, color: Colors.indigo.shade200),
          const SizedBox(height: 16),
          const Text('暂无角色', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('创建第一个角色，开始灵魂对话'),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateScreen())).then((_) => loadCharacters()),
            icon: const Icon(Icons.add),
            label: const Text('创建角色'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.indigo,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCharacterCard(Character character) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.push(context, MaterialPageRoute(
          builder: (_) => ChatScreen(character: character),
        )).then((_) => loadCharacters()),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              _buildAvatar(
                character.avatarUrl,
                28,
                fallback: CircleAvatar(
                  radius: 28,
                  backgroundColor: Colors.indigo.shade100,
                  child: Text(character.nickname.isNotEmpty ? character.nickname[0] : '?', style: const TextStyle(fontSize: 20)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(character.nickname, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(
                      character.relationship ?? '还未设置关系',
                      style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
              _buildStatusChip(character.analysisStatus),
              const SizedBox(width: 4),
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, size: 20),
                onSelected: (value) => _handleMenuAction(value, character),
                itemBuilder: (_) => [
                  const PopupMenuItem(value: 'analysis', child: Text('查看分析')),
                  const PopupMenuItem(value: 'edit', child: Text('编辑角色')),
                  const PopupMenuItem(value: 'delete', child: Text('删除角色', style: TextStyle(color: Colors.red))),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    String label;
    switch (status) {
      case 'DONE':
        color = Colors.green;
        label = '已分析';
        break;
      case 'RUNNING':
        color = Colors.orange;
        label = '分析中';
        break;
      case 'FAILED':
        color = Colors.red;
        label = '失败';
        break;
      default:
        color = Colors.grey;
        label = '未分析';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w500)),
    );
  }

  void _handleMenuAction(String action, Character character) async {
    switch (action) {
      case 'analysis':
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => AnalysisScreen(character: character),
        )).then((_) => loadCharacters());
        break;
      case 'edit':
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => EditScreen(character: character),
        )).then((_) => loadCharacters());
        break;
      case 'delete':
        _deleteCharacter(character);
        break;
    }
  }

  void _deleteCharacter(Character character) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('确认删除'),
        content: Text('确定要删除角色"${character.nickname}"吗？此操作不可恢复。'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('取消')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('删除', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (result != true) return;

    try {
      final res = await ApiClient.delete('/api/characters/${character.id}');
      if (res.statusCode == 200 && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已删除')));
        loadCharacters();
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('删除失败')));
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('删除失败')));
    }
  }
}

class CreateScreen extends StatefulWidget {
  const CreateScreen({super.key});

  @override
  State<CreateScreen> createState() => _CreateScreenState();
}

class _CreateScreenState extends State<CreateScreen> {
  final _nicknameController = TextEditingController();
  final _relationshipController = TextEditingController();
  final _backgroundController = TextEditingController();
  final _timeframeController = TextEditingController();
  final _impressionController = TextEditingController();
  final _pastedTextController = TextEditingController();
  String? _avatarPath;
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('创建角色')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildSectionTitle('基本信息'),
          const SizedBox(height: 8),
          TextField(
            controller: _nicknameController,
            decoration: const InputDecoration(
              labelText: '人物昵称 *',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.person),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _relationshipController,
            decoration: const InputDecoration(
              labelText: '与你的关系',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.people),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _backgroundController,
            decoration: const InputDecoration(
              labelText: '相识背景',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.history),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _timeframeController,
            decoration: const InputDecoration(
              labelText: '认识时间跨度',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.calendar_today),
            ),
          ),
          const SizedBox(height: 20),
          _buildSectionTitle('头像'),
          const SizedBox(height: 8),
          Center(
            child: GestureDetector(
              onTap: _pickAvatar,
              child: CircleAvatar(
                radius: 40,
                backgroundColor: Colors.indigo.shade100,
                backgroundImage: _avatarPath != null ? FileImage(File(_avatarPath!)) : null,
                child: _avatarPath == null
                    ? Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_a_photo, color: Colors.indigo.shade400),
                          const Text('选择头像', style: TextStyle(fontSize: 10)),
                        ],
                      )
                    : null,
              ),
            ),
          ),
          const SizedBox(height: 20),
          _buildSectionTitle('主观印象'),
          const SizedBox(height: 8),
          TextField(
            controller: _impressionController,
            decoration: const InputDecoration(
              labelText: '你的主观印象',
              hintText: '你对这个人的整体感觉...',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.psychology),
            ),
            maxLines: 3,
          ),
          const SizedBox(height: 20),
          _buildSectionTitle('聊天资料 *', subtitle: '请勿上传身份证号、银行卡等敏感信息'),
          const SizedBox(height: 8),
          TextField(
            controller: _pastedTextController,
            decoration: const InputDecoration(
              labelText: '粘贴聊天记录文本',
              hintText: '将聊天记录粘贴到这里...',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.chat),
            ),
            maxLines: 8,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _isLoading ? null : _handleSubmit,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.indigo,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isLoading
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('创建角色', style: TextStyle(fontSize: 16)),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, {String? subtitle}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        if (subtitle != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(subtitle, style: TextStyle(fontSize: 12, color: Colors.orange.shade700)),
          ),
      ],
    );
  }

  void _pickAvatar() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery, maxWidth: 512, maxHeight: 512);
    if (image != null) setState(() => _avatarPath = image.path);
  }

  void _handleSubmit() async {
    if (_nicknameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请填写人物昵称')));
      return;
    }
    if (_pastedTextController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请填写聊天资料')));
      return;
    }
    setState(() => _isLoading = true);

    try {
      List<http.MultipartFile> files = [];
      String? avatarUrl;

      if (_avatarPath != null) {
        final file = await http.MultipartFile.fromPath('avatarUrl', _avatarPath!);
        files.add(file);
      }

      final fields = <String, String>{
        'nickname': _nicknameController.text.trim(),
        'relationship': _relationshipController.text.trim(),
        'background': _backgroundController.text.trim(),
        'timeframe': _timeframeController.text.trim(),
        'impression': _impressionController.text.trim(),
        'pastedText': _pastedTextController.text.trim(),
      };

      final res = await ApiClient.postFormData('/api/characters', fields, files);

      if (res.statusCode == 200 && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('创建成功')));
        Navigator.pop(context);
      } else if (mounted) {
        final data = jsonDecode(res.body);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['error'] ?? '创建失败')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('创建失败')));
    }
    setState(() => _isLoading = false);
  }
}

class EditScreen extends StatefulWidget {
  final Character character;
  const EditScreen({super.key, required this.character});

  @override
  State<EditScreen> createState() => _EditScreenState();
}

class _EditScreenState extends State<EditScreen> {
  late TextEditingController _nicknameController;
  late TextEditingController _relationshipController;
  late TextEditingController _backgroundController;
  late TextEditingController _timeframeController;
  late TextEditingController _impressionController;
  String? _avatarPath;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nicknameController = TextEditingController(text: widget.character.nickname);
    _relationshipController = TextEditingController(text: widget.character.relationship ?? '');
    _backgroundController = TextEditingController(text: widget.character.background ?? '');
    _timeframeController = TextEditingController(text: widget.character.timeframe ?? '');
    _impressionController = TextEditingController(text: widget.character.impression ?? '');
  }

  @override
  void dispose() {
    _nicknameController.dispose();
    _relationshipController.dispose();
    _backgroundController.dispose();
    _timeframeController.dispose();
    _impressionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('编辑角色')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: GestureDetector(
              onTap: _pickAvatar,
              child: _avatarPath != null
                  ? ClipOval(
                      child: Image.file(File(_avatarPath!), width: 80, height: 80, fit: BoxFit.cover),
                    )
                  : _buildAvatar(
                      widget.character.avatarUrl,
                      40,
                      fallback: CircleAvatar(
                        radius: 40,
                        backgroundColor: Colors.indigo.shade100,
                        child: const Icon(Icons.add_a_photo, size: 30),
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _nicknameController,
            decoration: const InputDecoration(labelText: '人物昵称 *', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _relationshipController,
            decoration: const InputDecoration(labelText: '与你的关系', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _backgroundController,
            decoration: const InputDecoration(labelText: '相识背景', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _timeframeController,
            decoration: const InputDecoration(labelText: '认识时间跨度', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _impressionController,
            decoration: const InputDecoration(labelText: '你的主观印象', border: OutlineInputBorder()),
            maxLines: 3,
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('取消'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleSave,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.indigo,
                    foregroundColor: Colors.white,
                  ),
                  child: _isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('保存修改'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _pickAvatar() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery, maxWidth: 512, maxHeight: 512);
    if (image != null) setState(() => _avatarPath = image.path);
  }

  void _handleSave() async {
    if (_nicknameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请填写人物昵称')));
      return;
    }
    setState(() => _isLoading = true);

    try {
      String? avatarUrl = widget.character.avatarUrl;

      if (_avatarPath != null) {
        final file = await http.MultipartFile.fromPath('avatarUrl', _avatarPath!);
        final uploadRes = await ApiClient.postFormData('/api/characters', {
          'nickname': _nicknameController.text.trim(),
        }, [file]);
        if (uploadRes.statusCode == 200) {
          final data = jsonDecode(uploadRes.body);
          avatarUrl = data['avatarUrl'];
        }
      }

      final res = await ApiClient.patch('/api/characters/${widget.character.id}', body: {
        'nickname': _nicknameController.text.trim(),
        'relationship': _relationshipController.text.trim(),
        'background': _backgroundController.text.trim(),
        'timeframe': _timeframeController.text.trim(),
        'impression': _impressionController.text.trim(),
        'avatarUrl': avatarUrl,
      });

      if (res.statusCode == 200 && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('保存成功')));
        Navigator.pop(context);
      } else if (mounted) {
        final data = jsonDecode(res.body);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['error'] ?? '保存失败')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('保存失败')));
    }
    setState(() => _isLoading = false);
  }
}

class AnalysisScreen extends StatefulWidget {
  final Character character;
  const AnalysisScreen({super.key, required this.character});

  @override
  State<AnalysisScreen> createState() => _AnalysisScreenState();
}

class _AnalysisScreenState extends State<AnalysisScreen> {
  Character? _character;
  Analysis? _analysis;
  bool _isLoading = true;
  bool _isRunning = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final res = await ApiClient.get('/api/characters/${widget.character.id}');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          _character = Character.fromJson(data);
          _analysis = _character?.analysis;
        });
      } else {
        final data = jsonDecode(res.body);
        setState(() => _error = data['error'] ?? '加载失败 (${res.statusCode})');
      }
    } catch (e) {
      setState(() => _error = '网络错误，请检查网络连接');
    }
    setState(() => _isLoading = false);
  }

  void _startAnalysis() async {
    setState(() => _isRunning = true);
    try {
      final res = await ApiClient.post('/api/analysis/${widget.character.id}');
      if (res.statusCode == 200) {
        _loadData();
      } else {
        final data = jsonDecode(res.body);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['error'] ?? '分析失败')));
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('分析失败')));
    }
    setState(() => _isRunning = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.character.nickname),
        actions: [
          TextButton.icon(
            onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(
              builder: (_) => ChatScreen(character: widget.character),
            )),
            icon: const Icon(Icons.chat),
            label: const Text('进入聊天'),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildError()
              : _analysis == null
                  ? _buildNoAnalysis()
                  : _buildAnalysisReport(),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(_error!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadData,
              icon: const Icon(Icons.refresh),
              label: const Text('重试'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoAnalysis() {
    final status = _character?.analysisStatus ?? 'NOT_STARTED';
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.psychology, size: 80, color: Colors.indigo.shade200),
          const SizedBox(height: 24),
          if (status == 'RUNNING') ...[
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            const Text('AI 正在分析中...', style: TextStyle(fontSize: 16)),
            const SizedBox(height: 8),
            const Text('请稍候，这可能需要几分钟', style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 24),
            OutlinedButton(
              onPressed: _loadData,
              child: const Text('刷新状态'),
            ),
          ] else if (status == 'FAILED') ...[
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            const Text('分析失败', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _isRunning ? null : _startAnalysis,
              icon: const Icon(Icons.refresh),
              label: const Text('重新分析'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigo,
                foregroundColor: Colors.white,
              ),
            ),
          ] else ...[
            const Text('开启深度画像分析', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('AI 将分析聊天资料，生成人格画像', style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _isRunning ? null : _startAnalysis,
              icon: const Icon(Icons.auto_awesome),
              label: const Text('开始 AI 分析'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.indigo,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAnalysisReport() {
    return RefreshIndicator(
      onRefresh: () async => _loadData(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildHeader(),
          const SizedBox(height: 16),
          if (_analysis?.persona != null) _buildPersonaCard(),
          if (_analysis?.memories != null) ...[const SizedBox(height: 12), _buildMemoriesCard()],
          if (_analysis?.speakingStyle != null) ...[const SizedBox(height: 12), _buildSpeakingStyleCard()],
          if (_analysis?.emotionPattern != null) ...[const SizedBox(height: 12), _buildEmotionPatternCard()],
          if (_analysis?.relationshipPattern != null) ...[const SizedBox(height: 12), _buildRelationshipPatternCard()],
          const SizedBox(height: 12),
          _buildSourceDocuments(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            _buildAvatar(
              widget.character.avatarUrl,
              30,
              fallback: CircleAvatar(
                radius: 30,
                backgroundColor: Colors.indigo.shade100,
                child: Text(widget.character.nickname.isNotEmpty ? widget.character.nickname[0] : '?'),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.character.nickname, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  if (widget.character.relationship != null)
                    Text(widget.character.relationship!, style: TextStyle(color: Colors.grey.shade600)),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle, size: 16, color: Colors.green),
                  SizedBox(width: 4),
                  Text('分析完成', style: TextStyle(color: Colors.green, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPersonaCard() {
    final persona = _analysis!.persona!;
    final summary = persona['summary'] ?? '';
    final traits = persona['traits'] as List<dynamic>? ?? [];

    return _buildExpandableCard(
      title: '人格特质',
      icon: Icons.psychology,
      children: [
        if (summary.isNotEmpty) Text(summary, style: const TextStyle(fontSize: 14)),
        if (traits.isNotEmpty) ...[
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: traits.map((t) => Chip(
              label: Text(t.toString(), style: const TextStyle(fontSize: 12)),
              backgroundColor: Colors.indigo.shade50,
            )).toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildMemoriesCard() {
    final memories = _analysis!.memories!;
    final events = memories['events'] as List<dynamic>? ?? [];

    return _buildExpandableCard(
      title: '核心记忆',
      icon: Icons.memory,
      children: events.map((e) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(e['event'] ?? '', style: const TextStyle(fontWeight: FontWeight.w500)),
            if (e['emotionalAnchor'] != null)
              Text('情感锚点: ${e['emotionalAnchor']}', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
            if (e['sentiment'] != null)
              Text('情感倾向: ${e['sentiment']}', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
          ],
        ),
      )).toList(),
    );
  }

  Widget _buildSpeakingStyleCard() {
    final style = _analysis!.speakingStyle!;
    final tone = style['tone'] ?? '';
    final habits = style['habits'] as List<dynamic>? ?? [];
    final samplePhrases = style['samplePhrases'] as List<dynamic>? ?? [];
    final emojiUsage = style['emojiUsage'] ?? '';
    final responseSpeed = style['responseSpeed'] ?? '';

    return _buildExpandableCard(
      title: '说话风格',
      icon: Icons.record_voice_over,
      children: [
        _buildInfoRow('语气基调', tone),
        if (habits.isNotEmpty) ...[
          const SizedBox(height: 8),
          const Text('语言习惯:', style: TextStyle(fontWeight: FontWeight.w500)),
          ...habits.map((h) => Padding(
            padding: const EdgeInsets.only(left: 8, top: 4),
            child: Text('• $h', style: const TextStyle(fontSize: 14)),
          )),
        ],
        if (samplePhrases.isNotEmpty) ...[
          const SizedBox(height: 8),
          const Text('典型用语:', style: TextStyle(fontWeight: FontWeight.w500)),
          ...samplePhrases.map((p) => Padding(
            padding: const EdgeInsets.only(left: 8, top: 4),
            child: Text('"$p"', style: TextStyle(fontSize: 14, fontStyle: FontStyle.italic, color: Colors.grey.shade700)),
          )),
        ],
        if (emojiUsage.isNotEmpty) ...[
          const SizedBox(height: 8),
          _buildInfoRow('表情使用', emojiUsage),
        ],
        if (responseSpeed.isNotEmpty) ...[
          const SizedBox(height: 4),
          _buildInfoRow('回复速度', responseSpeed),
        ],
      ],
    );
  }

  Widget _buildEmotionPatternCard() {
    final emotion = _analysis!.emotionPattern!;
    final commonEmotions = emotion['commonEmotions'] as List<dynamic>? ?? [];
    final positiveTriggers = emotion['positiveTriggers'] as List<dynamic>? ?? [];
    final negativeTriggers = emotion['negativeTriggers'] as List<dynamic>? ?? [];
    final regulationStyle = emotion['regulationStyle'] ?? '';
    final expressiveness = emotion['expressiveness'] ?? '';

    return _buildExpandableCard(
      title: '情感模式',
      icon: Icons.favorite,
      children: [
        if (commonEmotions.isNotEmpty) ...[
          const Text('常见情绪:', style: TextStyle(fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: commonEmotions.map((e) => Chip(
              label: Text(e.toString(), style: const TextStyle(fontSize: 12)),
              backgroundColor: Colors.pink.shade50,
            )).toList(),
          ),
        ],
        if (positiveTriggers.isNotEmpty) ...[
          const SizedBox(height: 12),
          const Text('积极触发:', style: TextStyle(fontWeight: FontWeight.w500, color: Colors.green)),
          ...positiveTriggers.map((t) => Padding(
            padding: const EdgeInsets.only(left: 8, top: 4),
            child: Text('• $t', style: const TextStyle(fontSize: 14)),
          )),
        ],
        if (negativeTriggers.isNotEmpty) ...[
          const SizedBox(height: 12),
          const Text('消极触发:', style: TextStyle(fontWeight: FontWeight.w500, color: Colors.red)),
          ...negativeTriggers.map((t) => Padding(
            padding: const EdgeInsets.only(left: 8, top: 4),
            child: Text('• $t', style: const TextStyle(fontSize: 14)),
          )),
        ],
        if (regulationStyle.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildInfoRow('情绪调节', regulationStyle),
        ],
        if (expressiveness.isNotEmpty) ...[
          const SizedBox(height: 4),
          _buildInfoRow('表达方式', expressiveness),
        ],
      ],
    );
  }

  Widget _buildRelationshipPatternCard() {
    final rel = _analysis!.relationshipPattern!;
    final attachmentStyle = rel['attachmentStyle'] ?? '';
    final dynamics = rel['interactionDynamics'] as List<dynamic>? ?? [];
    final boundaries = rel['boundaries'] ?? '';
    final conflictStyle = rel['conflictStyle'] ?? '';
    final careExpression = rel['careExpression'] ?? '';

    return _buildExpandableCard(
      title: '关系互动模式',
      icon: Icons.handshake,
      children: [
        _buildInfoRow('依恋风格', attachmentStyle),
        if (dynamics.isNotEmpty) ...[
          const SizedBox(height: 12),
          const Text('互动特点:', style: TextStyle(fontWeight: FontWeight.w500)),
          ...dynamics.map((d) => Padding(
            padding: const EdgeInsets.only(left: 8, top: 4),
            child: Text('• $d', style: const TextStyle(fontSize: 14)),
          )),
        ],
        if (boundaries.isNotEmpty) ...[
          const SizedBox(height: 12),
          _buildInfoRow('边界感', boundaries),
        ],
        if (conflictStyle.isNotEmpty) ...[
          const SizedBox(height: 4),
          _buildInfoRow('冲突处理', conflictStyle),
        ],
        if (careExpression.isNotEmpty) ...[
          const SizedBox(height: 4),
          _buildInfoRow('关心表达', careExpression),
        ],
      ],
    );
  }

  Widget _buildExpandableCard({required String title, required IconData icon, required List<Widget> children}) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: ExpansionTile(
        leading: Icon(icon, color: Colors.indigo),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        initiallyExpanded: true,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$label: ', style: const TextStyle(fontWeight: FontWeight.w500)),
        Expanded(child: Text(value)),
      ],
    );
  }

  Widget _buildSourceDocuments() {
    final docs = _character?.sourceDocuments ?? [];
    if (docs.isEmpty) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.description, color: Colors.indigo, size: 20),
                SizedBox(width: 8),
                Text('源文档', style: TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 12),
            ...docs.map((doc) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  const Icon(Icons.insert_drive_file, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  Expanded(child: Text(doc.filename, style: const TextStyle(fontSize: 13))),
                  Text('${(doc.content.length / 1024).toStringAsFixed(1)}KB',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }
}

class ChatScreen extends StatefulWidget {
  final Character character;
  const ChatScreen({super.key, required this.character});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List<ChatMessage> _messages = [];
  final _inputController = TextEditingController();
  final _scrollController = ScrollController();
  bool _isLoading = false;
  bool _typing = false;

  @override
  void initState() {
    super.initState();
    loadMessages();
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void loadMessages() async {
    try {
      final res = await ApiClient.get('/api/chat/${widget.character.id}');
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        setState(() => _messages = data.map((m) => ChatMessage.fromJson(m)).toList());
        _scrollToBottom();
      }
    } catch (_) {}
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.character.nickname),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: '重新生成',
            onPressed: _messages.isEmpty ? null : _regenerateMessage,
          ),
          IconButton(
            icon: const Icon(Icons.delete_sweep),
            tooltip: '清空对话',
            onPressed: _clearChat,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _messages.isEmpty
                ? _buildEmptyChat()
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) => _buildMessage(_messages[index]),
                  ),
          ),
          if (_typing) _buildTypingIndicator(),
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildEmptyChat() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.auto_awesome, size: 64, color: Colors.indigo.shade200),
          const SizedBox(height: 16),
          const Text('开启灵魂对话', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text('与 ${widget.character.nickname} 进行对话', style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildMessage(ChatMessage msg) {
    final isUser = msg.role == 'user';
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
          children: [
            if (!isUser) ...[
              _buildAvatar(
                widget.character.avatarUrl,
                16,
                fallback: CircleAvatar(
                  radius: 16,
                  backgroundColor: Colors.indigo.shade100,
                  child: Text(widget.character.nickname.isNotEmpty ? widget.character.nickname[0] : '?', style: const TextStyle(fontSize: 12)),
                ),
              ),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isUser ? Colors.indigo : Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  msg.content,
                  style: TextStyle(color: isUser ? Colors.white : Theme.of(context).colorScheme.onSurface),
                ),
              ),
            ),
            if (isUser) ...[
              const SizedBox(width: 8),
              _buildAvatar(
                widget.character.userAvatarUrl,
                16,
                fallback: CircleAvatar(
                  radius: 16,
                  backgroundColor: Colors.blue.shade100,
                  child: const Icon(Icons.person, size: 16, color: Colors.blue),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: Colors.indigo.shade100,
            child: Text(widget.character.nickname.isNotEmpty ? widget.character.nickname[0] : '?', style: const TextStyle(fontSize: 11)),
          ),
          const SizedBox(width: 8),
          Row(
            children: List.generate(3, (i) => TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: 1),
              duration: const Duration(milliseconds: 600),
              builder: (context, value, child) => Container(
                margin: const EdgeInsets.symmetric(horizontal: 2),
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: Colors.grey.shade400.withOpacity(value),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            )),
          ),
        ],
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -2))],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _inputController,
                decoration: InputDecoration(
                  hintText: '与 ${widget.character.nickname} 对话...',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                maxLines: null,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              decoration: BoxDecoration(
                color: Colors.indigo,
                borderRadius: BorderRadius.circular(24),
              ),
              child: IconButton(
                onPressed: _isLoading ? null : _sendMessage,
                icon: const Icon(Icons.send, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _sendMessage() async {
    final content = _inputController.text.trim();
    if (content.isEmpty) return;

    final userMsg = ChatMessage(id: 'temp', role: 'user', content: content, createdAt: DateTime.now());
    setState(() {
      _messages.add(userMsg);
      _typing = true;
      _isLoading = true;
    });
    _inputController.clear();
    _scrollToBottom();

    try {
      final res = await ApiClient.post('/api/chat/${widget.character.id}', body: {'content': content});
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          _messages.removeWhere((m) => m.id == 'temp');
          _messages.add(ChatMessage.fromJson(data['user']));
          _messages.add(ChatMessage.fromJson(data['assistant']));
          _typing = false;
        });
        _scrollToBottom();
      } else {
        setState(() {
          _messages.removeWhere((m) => m.id == 'temp');
          _typing = false;
        });
        if (mounted) {
          final data = jsonDecode(res.body);
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['error'] ?? '发送失败')));
        }
      }
    } catch (_) {
      setState(() {
        _messages.removeWhere((m) => m.id == 'temp');
        _typing = false;
      });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('发送失败')));
    }
    setState(() => _isLoading = false);
  }

  void _regenerateMessage() async {
    if (_messages.isEmpty) return;
    setState(() => _typing = true);

    try {
      final res = await ApiClient.post('/api/chat/${widget.character.id}/regenerate');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          if (_messages.isNotEmpty && _messages.last.role == 'assistant') {
            _messages.removeLast();
          }
          _messages.add(ChatMessage.fromJson(data));
          _typing = false;
        });
        _scrollToBottom();
      } else {
        setState(() => _typing = false);
        if (mounted) {
          final data = jsonDecode(res.body);
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['error'] ?? '重新生成失败')));
        }
      }
    } catch (_) {
      setState(() => _typing = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('重新生成失败')));
    }
  }

  void _clearChat() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('确定清空对话？'),
        content: const Text('此操作不可恢复'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('取消')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('确定', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (result != true) return;

    await ApiClient.delete('/api/chat/${widget.character.id}');
    setState(() => _messages.clear());
  }
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  List<RecentAccount> _recentAccounts = [];

  @override
  void initState() {
    super.initState();
    _loadRecentAccounts();
  }

  void _loadRecentAccounts() async {
    final accounts = await AuthService.getRecentAccounts();
    if (mounted) setState(() => _recentAccounts = accounts);
  }

  void _switchAccount(RecentAccount account) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('切换账号'),
        content: Text('确定切换到 ${account.email}？'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('取消')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('切换')),
        ],
      ),
    );
    if (confirm != true) return;

    final success = await AuthService.switchAccount(account);
    if (!mounted) return;

    if (success) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const MainScreen()));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('账号已失效，请重新登录')),
      );
      _loadRecentAccounts();
    }
  }

  void _removeAccount(RecentAccount account) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('删除账号'),
        content: Text('确定从最近登录列表中移除 ${account.email}？'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('取消')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('删除', style: TextStyle(color: Colors.red))),
        ],
      ),
    );
    if (confirm != true) return;

    await AuthService.removeRecentAccount(account.email);
    _loadRecentAccounts();
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService.currentUser;
    return Scaffold(
      appBar: AppBar(title: const Text('我的')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: Colors.indigo.shade100,
                    child: Text(
                      user?.nickname?.isNotEmpty == true ? user!.nickname![0] : (user?.email[0].toUpperCase() ?? '?'),
                      style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user?.nickname ?? user?.email ?? '未知用户',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  if (user?.nickname != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(user!.email, style: TextStyle(color: Colors.grey.shade600)),
                    ),
                  if (user?.isAdmin == true)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Chip(
                        label: const Text('管理员'),
                        backgroundColor: Colors.amber.shade100,
                        avatar: const Icon(Icons.shield, size: 16),
                      ),
                    ),
                ],
              ),
            ),
          ),
          if (_recentAccounts.length > 1) ...[
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.history, size: 20, color: Colors.indigo.shade400),
                        const SizedBox(width: 8),
                        const Text('最近登录账号', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ...List.generate(_recentAccounts.length, (i) {
                      final account = _recentAccounts[i];
                      final isCurrent = account.email == user?.email;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: InkWell(
                          onTap: isCurrent ? null : () => _switchAccount(account),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: isCurrent ? Colors.indigo.shade50 : Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isCurrent ? Colors.indigo.shade200 : Colors.grey.shade200,
                              ),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 18,
                                  backgroundColor: isCurrent ? Colors.indigo.shade300 : Colors.grey.shade400,
                                  child: Text(
                                    (account.nickname ?? account.email)[0].toUpperCase(),
                                    style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        account.nickname ?? account.email,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: isCurrent ? FontWeight.w600 : FontWeight.normal,
                                          color: isCurrent ? Colors.indigo.shade700 : Colors.grey.shade800,
                                        ),
                                      ),
                                      if (account.nickname != null)
                                        Text(account.email, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                                    ],
                                  ),
                                ),
                                if (isCurrent)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.indigo.shade100,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text('当前', style: TextStyle(fontSize: 11, color: Colors.indigo.shade700)),
                                  )
                                else
                                  IconButton(
                                    icon: Icon(Icons.close, size: 18, color: Colors.grey.shade400),
                                    onPressed: () => _removeAccount(account),
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.dark_mode),
                  title: const Text('深色模式'),
                  trailing: Switch(
                    value: MyApp.themeNotifier.value == ThemeMode.dark,
                    onChanged: (value) {
                      MyApp.themeNotifier.value = value ? ThemeMode.dark : ThemeMode.light;
                    },
                  ),
                ),
                if (user?.isAdmin == true)
                  ListTile(
                    leading: const Icon(Icons.admin_panel_settings),
                    title: const Text('管理员面板'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminScreen())),
                  ),
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: const Text('关于'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => showAboutDialog(
                    context: context,
                    applicationName: '千人智聊',
                    applicationVersion: '1.0.0',
                    children: const [Text('赋予聊天记录第二次生命，构建可永久保存的数字灵魂')],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () async {
              await AuthService.logout();
              if (context.mounted) {
                Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
              }
            },
            icon: const Icon(Icons.logout),
            label: const Text('退出登录'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade50,
              foregroundColor: Colors.red,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  List<dynamic> _users = [];
  List<dynamic> _characters = [];
  bool _isLoading = true;
  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    loadData();
  }

  void loadData() async {
    setState(() => _isLoading = true);
    try {
      final userRes = await ApiClient.get('/api/admin/users');
      final charRes = await ApiClient.get('/api/admin/characters');
      if (userRes.statusCode == 200) setState(() => _users = jsonDecode(userRes.body));
      if (charRes.statusCode == 200) setState(() => _characters = jsonDecode(charRes.body));
    } catch (_) {}
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.shield, size: 20),
            SizedBox(width: 8),
            Text('管理员面板'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: SegmentedButton<int>(
                          segments: const [
                            ButtonSegment(value: 0, label: Text('用户管理'), icon: Icon(Icons.people)),
                            ButtonSegment(value: 1, label: Text('全部角色'), icon: Icon(Icons.smart_toy)),
                          ],
                          selected: {_tabIndex},
                          onSelectionChanged: (set) => setState(() => _tabIndex = set.first),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: _tabIndex == 0 ? _buildUsersList() : _buildCharactersList(),
                ),
              ],
            ),
    );
  }

  Widget _buildUsersList() {
    return ListView.builder(
      itemCount: _users.length,
      itemBuilder: (context, index) {
        final user = _users[index];
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: ListTile(
            leading: CircleAvatar(
              child: Text((user['nickname'] ?? user['email'])[0].toUpperCase()),
            ),
            title: Text(user['nickname'] ?? user['email']),
            subtitle: Text(user['email']),
            trailing: user['isAdmin'] == true
                ? Chip(
                    label: const Text('管理员', style: TextStyle(fontSize: 11)),
                    backgroundColor: Colors.amber.shade100,
                    padding: EdgeInsets.zero,
                  )
                : null,
          ),
        );
      },
    );
  }

  Widget _buildCharactersList() {
    return ListView.builder(
      itemCount: _characters.length,
      itemBuilder: (context, index) {
        final char = _characters[index];
        final status = char['analysisStatus'] ?? 'NOT_STARTED';
        Color statusColor;
        String statusLabel;
        switch (status) {
          case 'DONE':
            statusColor = Colors.green;
            statusLabel = '已分析';
            break;
          case 'RUNNING':
            statusColor = Colors.orange;
            statusLabel = '分析中';
            break;
          case 'FAILED':
            statusColor = Colors.red;
            statusLabel = '失败';
            break;
          default:
            statusColor = Colors.grey;
            statusLabel = '未分析';
        }

        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: ListTile(
            onTap: () => _navigateToChat(char),
            leading: CircleAvatar(
              backgroundColor: Colors.indigo.shade100,
              child: Text((char['nickname'] ?? '?')[0]),
            ),
            title: Text(char['nickname'] ?? '未知'),
            subtitle: Text(char['user']?['email'] ?? '未知用户'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(statusLabel, style: TextStyle(color: statusColor, fontSize: 11)),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.chevron_right, color: Colors.grey),
              ],
            ),
          ),
        );
      },
    );
  }

  void _navigateToChat(Map<String, dynamic> charData) {
    try {
      final character = Character.fromJson(charData);
      Navigator.push(context, MaterialPageRoute(
        builder: (_) => ChatScreen(character: character),
      ));
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('无法加载角色信息')),
      );
    }
  }
}
