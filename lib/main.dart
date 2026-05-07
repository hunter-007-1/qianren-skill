import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'models.dart';
import 'auth_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiClient.init();
  await AuthService.checkAuth();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '千人智聊',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: AuthService.isLoading 
        ? const LoadingScreen() 
        : AuthService.currentUser != null 
          ? const HomeScreen() 
          : const LoginScreen(),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
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
                ? const CircularProgressIndicator(color: Colors.white) 
                : const Text('登录', style: TextStyle(fontSize: 16)),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
              child: const Text('没有账号？去注册'),
            ),
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
    final success = await AuthService.login(_emailController.text, _passwordController.text);
    setState(() => _isLoading = false);
    if (success && mounted) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const HomeScreen()));
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('登录失败')));
    }
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
                ? const CircularProgressIndicator(color: Colors.white) 
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
    final success = await AuthService.register(
      _emailController.text, 
      _passwordController.text,
      _nicknameController.text.isEmpty ? null : _nicknameController.text,
    );
    setState(() => _isLoading = false);
    if (success && mounted) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const HomeScreen()));
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('注册失败')));
    }
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
  int _selectedIndex = 0;

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
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.auto_awesome, color: Colors.indigo),
            const SizedBox(width: 8),
            const Text('千人智聊'),
          ],
        ),
        actions: [
          if (AuthService.currentUser?.isAdmin == true)
            IconButton(
              icon: const Icon(Icons.admin_panel_settings),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdminScreen())),
            ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await AuthService.logout();
              if (mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
            },
          ),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _characters.isEmpty 
          ? _buildEmptyState()
          : ListView.builder(
              itemCount: _characters.length,
              itemBuilder: (context, index) => _buildCharacterCard(_characters[index]),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateScreen())).then((_) => loadCharacters()),
        child: const Icon(Icons.add),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (i) => setState(() => _selectedIndex = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: '首页'),
          NavigationDestination(icon: Icon(Icons.add_circle), label: '创建'),
          NavigationDestination(icon: Icon(Icons.person), label: '我的'),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.auto_awesome, size: 64, color: Colors.indigo),
          const SizedBox(height: 16),
          const Text('暂无角色', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('创建第一个角色，开始灵魂对话'),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateScreen())).then((_) => loadCharacters()),
            icon: const Icon(Icons.add),
            label: const Text('创建角色'),
          ),
        ],
      ),
    );
  }

  Widget _buildCharacterCard(Character character) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.indigo.shade100,
          backgroundImage: character.avatarUrl != null ? NetworkImage(character.avatarUrl!) : null,
          child: character.avatarUrl == null ? Text(character.nickname[0]) : null,
        ),
        title: Text(character.nickname),
        subtitle: Text(character.relationship ?? '还未设置关系'),
        trailing: Chip(
          label: Text(character.analysisStatus, style: const TextStyle(fontSize: 12)),
        ),
        onTap: () => Navigator.push(context, MaterialPageRoute(
          builder: (_) => ChatScreen(character: character),
        )).then((_) => loadCharacters()),
      ),
    );
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
          TextField(
            controller: _nicknameController,
            decoration: const InputDecoration(labelText: '人物昵称 *', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _relationshipController,
            decoration: const InputDecoration(labelText: '与你的关系', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _backgroundController,
            decoration: const InputDecoration(labelText: '相识背景', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _timeframeController,
            decoration: const InputDecoration(labelText: '认识时间跨度', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Text('头像'),
              const SizedBox(width: 16),
              GestureDetector(
                onTap: _pickAvatar,
                child: CircleAvatar(
                  radius: 30,
                  backgroundImage: _avatarPath != null ? FileImage(File(_avatarPath!)) : null,
                  child: _avatarPath == null ? const Icon(Icons.add_a_photo) : null,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _impressionController,
            decoration: const InputDecoration(labelText: '你的主观印象', border: OutlineInputBorder()),
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _pastedTextController,
            decoration: const InputDecoration(labelText: '聊天资料 *', border: OutlineInputBorder()),
            maxLines: 6,
            hintText: '粘贴聊天记录文本',
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _isLoading ? null : _handleSubmit,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.indigo,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: _isLoading 
              ? const CircularProgressIndicator(color: Colors.white) 
              : const Text('创建角色'),
          ),
        ],
      ),
    );
  }

  void _pickAvatar() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) setState(() => _avatarPath = image.path);
  }

  void _handleSubmit() async {
    if (_nicknameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请填写人物昵称')));
      return;
    }
    if (_pastedTextController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请填写聊天资料')));
      return;
    }
    setState(() => _isLoading = true);
    
    try {
      final res = await http.post(
        Uri.parse('https://qianren-skill.up.railway.app/api/characters'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'nickname': _nicknameController.text,
          'relationship': _relationshipController.text,
          'background': _backgroundController.text,
          'timeframe': _timeframeController.text,
          'impression': _impressionController.text,
          'pastedText': _pastedTextController.text,
        }),
      );
      
      if (res.statusCode == 200 && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('创建成功')));
        Navigator.pop(context);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('创建失败')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('创建失败')));
    }
    setState(() => _isLoading = false);
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
  bool _isLoading = false;
  bool _typing = false;

  @override
  void initState() {
    super.initState();
    loadMessages();
  }

  void loadMessages() async {
    try {
      final res = await ApiClient.get('/api/chat/${widget.character.id}');
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        setState(() => _messages = data.map((m) => ChatMessage.fromJson(m)).toList());
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.character.nickname),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_sweep),
            onPressed: _clearChat,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) => _buildMessage(_messages[index]),
            ),
          ),
          if (_typing) _buildTypingIndicator(),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputController,
                    decoration: const InputDecoration(
                      hintText: '与 ${null} 对话...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _isLoading ? null : _sendMessage,
                  icon: const Icon(Icons.send, color: Colors.indigo),
                ),
              ],
            ),
          ),
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
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isUser ? Colors.indigo : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          msg.content,
          style: TextStyle(color: isUser ? Colors.white : Colors.black),
        ),
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Container(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: Colors.grey.shade200,
            child: Text(widget.character.nickname[0]),
          ),
          const SizedBox(width: 8),
          Row(
            children: List.generate(3, (i) => Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: Colors.grey.shade400,
                borderRadius: BorderRadius.circular(4),
              ),
            )),
          ),
        ],
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
    
    try {
      final res = await ApiClient.post('/api/chat/${widget.character.id}', {'content': content});
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          _messages.removeWhere((m) => m.id == 'temp');
          _messages.add(ChatMessage.fromJson(data['user']));
          _messages.add(ChatMessage.fromJson(data['assistant']));
          _typing = false;
        });
      }
    } catch (_) {
      setState(() {
        _messages.removeWhere((m) => m.id == 'temp');
        _typing = false;
      });
    }
    setState(() => _isLoading = false);
  }

  void _clearChat() async {
    if (!await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('确定清空对话？'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('取消')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('确定')),
        ],
      ),
    )) return;
    
    await ApiClient.delete('/api/chat/${widget.character.id}');
    setState(() => _messages.clear());
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
      appBar: AppBar(title: const Text('管理员面板')),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : ListView(
            children: [
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text('用户管理', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              ..._users.map((u) => ListTile(
                title: Text(u['nickname'] ?? u['email']),
                subtitle: Text(u['email']),
                trailing: u['isAdmin'] == true ? const Chip(label: Text('管理员')) : null,
              )),
              const Divider(),
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text('全部角色', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              ..._characters.map((c) => ListTile(
                title: Text(c['nickname']),
                subtitle: Text(c['user']?['email'] ?? '未知'),
              )),
            ],
          ),
    );
  }
}