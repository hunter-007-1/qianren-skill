import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiConstants {
  static const String defaultBaseUrl = 'https://wzhs.ccwu.cc';
  static const String sessionKey = 'qianren-session';
  static const String _baseUrlKey = 'qianren-api-base-url';
  static const Duration timeout = Duration(seconds: 10);

  static String? _cachedBaseUrl;

  static Future<String> getBaseUrl() async {
    if (_cachedBaseUrl != null) return _cachedBaseUrl!;
    final prefs = await SharedPreferences.getInstance();
    _cachedBaseUrl = prefs.getString(_baseUrlKey) ?? defaultBaseUrl;
    return _cachedBaseUrl!;
  }

  static Future<void> setBaseUrl(String url) async {
    _cachedBaseUrl = url;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_baseUrlKey, url);
  }

  static Future<void> resetBaseUrl() async {
    _cachedBaseUrl = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_baseUrlKey);
  }
}

class ApiClient {
  static String? _token;

  static String? get token => _token;

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
    final base = await ApiConstants.getBaseUrl();
    final res = await http.get(
      Uri.parse('$base$path'),
      headers: await _headers,
    ).timeout(ApiConstants.timeout);
    return res;
  }

  static Future<http.Response> post(String path, {Map<String, dynamic>? body, Duration? timeout}) async {
    final base = await ApiConstants.getBaseUrl();
    final url = '$base$path';
    final headers = await _headers;
    print('[ApiClient] POST $url');
    print('[ApiClient] Headers: $headers');
    if (body != null) print('[ApiClient] Body: ${jsonEncode(body)}');
    
    final res = await http.post(
      Uri.parse(url),
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    ).timeout(timeout ?? ApiConstants.timeout);
    
    print('[ApiClient] Response: ${res.statusCode}');
    return res;
  }

  static Future<http.Response> patch(String path, {Map<String, dynamic>? body}) async {
    final base = await ApiConstants.getBaseUrl();
    final res = await http.patch(
      Uri.parse('$base$path'),
      headers: await _headers,
      body: body != null ? jsonEncode(body) : null,
    ).timeout(ApiConstants.timeout);
    return res;
  }

  static Future<http.Response> delete(String path) async {
    final base = await ApiConstants.getBaseUrl();
    final res = await http.delete(
      Uri.parse('$base$path'),
      headers: await _headers,
    ).timeout(ApiConstants.timeout);
    return res;
  }

  static Future<http.Response> postFormData(String path, Map<String, String> fields, List<http.MultipartFile> files) async {
    final base = await ApiConstants.getBaseUrl();
    final uri = Uri.parse('$base$path');
    final request = http.MultipartRequest('POST', uri);

    if (_token != null) {
      request.headers['Cookie'] = '${ApiConstants.sessionKey}=$_token';
    }

    for (var entry in fields.entries) {
      request.fields[entry.key] = entry.value;
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
  final String? parseStatus;
  final DateTime createdAt;
  final Analysis? analysis;
  final List<SourceDocument>? sourceDocuments;

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
    this.parseStatus,
    required this.createdAt,
    this.analysis,
    this.sourceDocuments,
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
      parseStatus: json['parseStatus'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      analysis: json['analysis'] != null ? Analysis.fromJson(json['analysis']) : null,
      sourceDocuments: json['sourceDocuments'] != null
          ? (json['sourceDocuments'] as List).map((d) => SourceDocument.fromJson(d)).toList()
          : null,
    );
  }
}

class Analysis {
  final String id;
  final String characterId;
  final Map<String, dynamic>? persona;
  final Map<String, dynamic>? memories;
  final Map<String, dynamic>? speakingStyle;
  final Map<String, dynamic>? emotionPattern;
  final Map<String, dynamic>? relationshipPattern;
  final String? rawResponse;
  final String? modelName;

  Analysis({
    required this.id,
    required this.characterId,
    this.persona,
    this.memories,
    this.speakingStyle,
    this.emotionPattern,
    this.relationshipPattern,
    this.rawResponse,
    this.modelName,
  });

  factory Analysis.fromJson(Map<String, dynamic> json) {
    return Analysis(
      id: json['id'],
      characterId: json['characterId'],
      persona: _parseJsonField(json['persona']),
      memories: _parseJsonField(json['memories']),
      speakingStyle: _parseJsonField(json['speakingStyle']),
      emotionPattern: _parseJsonField(json['emotionPattern']),
      relationshipPattern: _parseJsonField(json['relationshipPattern']),
      rawResponse: json['rawResponse'],
      modelName: json['modelName'],
    );
  }

  static Map<String, dynamic>? _parseJsonField(dynamic field) {
    if (field == null) return null;
    if (field is Map<String, dynamic>) return field;
    if (field is String) {
      try {
        return jsonDecode(field);
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}

class SourceDocument {
  final String id;
  final String filename;
  final String? fileType;
  final String content;

  SourceDocument({
    required this.id,
    required this.filename,
    this.fileType,
    required this.content,
  });

  factory SourceDocument.fromJson(Map<String, dynamic> json) {
    return SourceDocument(
      id: json['id'],
      filename: json['filename'],
      fileType: json['fileType'],
      content: json['content'] ?? '',
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

class RecentAccount {
  final String email;
  final String? nickname;
  final String token;
  final DateTime lastLoginAt;

  RecentAccount({
    required this.email,
    this.nickname,
    required this.token,
    required this.lastLoginAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'nickname': nickname,
      'token': token,
      'lastLoginAt': lastLoginAt.toIso8601String(),
    };
  }

  factory RecentAccount.fromJson(Map<String, dynamic> json) {
    return RecentAccount(
      email: json['email'],
      nickname: json['nickname'],
      token: json['token'],
      lastLoginAt: DateTime.parse(json['lastLoginAt']),
    );
  }
}
