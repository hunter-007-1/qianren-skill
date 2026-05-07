class ApiConstants {
  static const String baseUrl = 'https://qianren-skill.up.railway.app';
  static const String sessionKey = 'qianren-session';
}

class ApiClient {
  static String? _token;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(ApiConstants.sessionKey);
  }

  static Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(ApiConstants.sessionKey, token);
  }

  static Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(ApiConstants.sessionKey);
  }

  static Future<Map<String, String>> get _headers async {
    return {
      'Content-Type': 'application/json',
      if (_token != null) 'Cookie': '${ApiConstants.sessionKey}=$_token',
    };
  }

  static Future<http.Response> get(String path) async {
    final res = await http.get(
      Uri.parse('${ApiConstants.baseUrl}$path'),
      headers: await _headers,
    );
    return res;
  }

  static Future<http.Response> post(String path, {Map<String, dynamic>? body}) async {
    final res = await http.post(
      Uri.parse('${ApiConstants.baseUrl}$path'),
      headers: await _headers,
      body: body != null ? jsonEncode(body) : null,
    );
    return res;
  }

  static Future<http.Response> delete(String path) async {
    final res = await http.delete(
      Uri.parse('${ApiConstants.baseUrl}$path'),
      headers: await _headers,
    );
    return res;
  }

  static Future<http.Response> postFormData(String path, Map<String, dynamic> fields, List<http.MultipartFile> files) async {
    final uri = Uri.parse('${ApiConstants.baseUrl}$path');
    final request = http.MultipartRequest('POST', uri);
    
    if (_token != null) {
      request.headers['Cookie'] = '${ApiConstants.sessionKey}=$_token';
    }
    
    for (var entry in fields.entries) {
      request.fields[entry.key] = entry.value.toString();
    }
    
    for (var file in files) {
      request.files.add(file);
    }
    
    final streamedRes = await request.send();
    return http.Response.fromStream(streamedRes);
  }
}

class User {
  final String id;
  final String email;
  final String? nickname;
  final bool isAdmin;

  User({required this.id, required this.email, this.nickname, this.isAdmin = false});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'],
      nickname: json['nickname'],
      isAdmin: json['isAdmin'] ?? false,
    );
  }
}

class Character {
  final String id;
  final String nickname;
  final String? avatarUrl;
  final String? userAvatarUrl;
  final String? relationship;
  final String? background;
  final String? timeframe;
  final String? impression;
  final String analysisStatus;
  final DateTime createdAt;

  Character({
    required this.id,
    required this.nickname,
    this.avatarUrl,
    this.userAvatarUrl,
    this.relationship,
    this.background,
    this.timeframe,
    this.impression,
    required this.analysisStatus,
    required this.createdAt,
  });

  factory Character.fromJson(Map<String, dynamic> json) {
    return Character(
      id: json['id'],
      nickname: json['nickname'],
      avatarUrl: json['avatarUrl'],
      userAvatarUrl: json['userAvatarUrl'],
      relationship: json['relationship'],
      background: json['background'],
      timeframe: json['timeframe'],
      impression: json['impression'],
      analysisStatus: json['analysisStatus'] ?? 'NOT_STARTED',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class ChatMessage {
  final String id;
  final String role;
  final String content;
  final DateTime createdAt;

  ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      role: json['role'],
      content: json['content'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}