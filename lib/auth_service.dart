import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'models.dart';

class AuthService {
  static User? currentUser;
  static bool isLoading = true;
  static VoidCallback? onAuthChecked;

  static const _recentAccountsKey = 'qianren-recent-accounts';
  static const _maxRecentAccounts = 5;

  static Future<void> saveRecentAccount(String email, String? nickname, String token) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString(_recentAccountsKey);
    List<RecentAccount> accounts = [];
    if (jsonStr != null) {
      try {
        final list = jsonDecode(jsonStr) as List;
        accounts = list.map((e) => RecentAccount.fromJson(e)).toList();
      } catch (_) {}
    }

    accounts.removeWhere((a) => a.email == email);
    accounts.insert(0, RecentAccount(
      email: email,
      nickname: nickname,
      token: token,
      lastLoginAt: DateTime.now(),
    ));

    if (accounts.length > _maxRecentAccounts) {
      accounts = accounts.sublist(0, _maxRecentAccounts);
    }

    await prefs.setString(_recentAccountsKey, jsonEncode(accounts.map((a) => a.toJson()).toList()));
  }

  static Future<List<RecentAccount>> getRecentAccounts() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString(_recentAccountsKey);
    if (jsonStr == null) return [];
    try {
      final list = jsonDecode(jsonStr) as List;
      return list.map((e) => RecentAccount.fromJson(e)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> removeRecentAccount(String email) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString(_recentAccountsKey);
    if (jsonStr == null) return;
    try {
      final list = jsonDecode(jsonStr) as List;
      final accounts = list.map((e) => RecentAccount.fromJson(e)).toList();
      accounts.removeWhere((a) => a.email == email);
      await prefs.setString(_recentAccountsKey, jsonEncode(accounts.map((a) => a.toJson()).toList()));
    } catch (_) {}
  }

  static Future<bool> switchAccount(RecentAccount account) async {
    await ApiClient.setToken(account.token);
    await checkAuth();
    if (currentUser != null) {
      await saveRecentAccount(currentUser!.email, currentUser!.nickname, account.token);
      return true;
    }
    await removeRecentAccount(account.email);
    return false;
  }

  static Future<void> checkAuth() async {
    isLoading = true;
    try {
      print('[AuthService] checkAuth 开始, token: ${ApiClient.token != null ? '存在' : '不存在'}');
      final res = await ApiClient.get('/api/auth/me');
      print('[AuthService] checkAuth 响应: ${res.statusCode}');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        print('[AuthService] checkAuth 数据: $data');
        if (data != null && data is Map<String, dynamic>) {
          currentUser = User.fromJson(data);
          print('[AuthService] checkAuth 成功: ${currentUser?.email}');
        } else {
          currentUser = null;
        }
      } else {
        print('[AuthService] checkAuth 失败: ${res.statusCode}');
        currentUser = null;
      }
    } catch (e) {
      print('[AuthService] checkAuth 异常: $e');
      currentUser = null;
    }
    isLoading = false;
    onAuthChecked?.call();
  }

  static Future<String?> login(String email, String password) async {
    try {
      print('[AuthService] 开始登录: $email');
      final res = await ApiClient.post('/api/auth/login', body: {
        'email': email,
        'password': password,
      }, timeout: const Duration(seconds: 30));

      print('[AuthService] 登录响应状态码: ${res.statusCode}');
      print('[AuthService] 登录响应体: ${res.body}');

      if (res.statusCode != 200) {
        try {
          final data = jsonDecode(res.body);
          return data['error'] ?? '登录失败';
        } catch (_) {
          if (res.statusCode >= 500) {
            return '服务器错误，请稍后重试 (${res.statusCode})';
          }
          return '登录失败 (${res.statusCode})';
        }
      }

      final token = _extractToken(res);
      print('[AuthService] 提取到token: ${token != null ? '${token.substring(0, 20)}...' : 'null'}');

      if (token == null) {
        return '无法提取登录凭证';
      }

      await ApiClient.setToken(token);
      print('[AuthService] Token已保存');

      // 优先从响应体中直接获取用户信息
      try {
        final data = jsonDecode(res.body);
        if (data is Map<String, dynamic> && data['user'] != null) {
          currentUser = User.fromJson(data['user']);
          await saveRecentAccount(currentUser!.email, currentUser!.nickname, token);
          onAuthChecked?.call();
          print('[AuthService] 从响应体获取用户信息成功: ${currentUser?.email}');
          return null;
        }
      } catch (e) {
        print('[AuthService] 从响应体获取用户信息失败: $e');
      }

      // 如果响应体中没有用户信息，尝试 checkAuth()
      await checkAuth();
      print('[AuthService] checkAuth完成, currentUser: ${currentUser?.email}');

      if (currentUser != null) {
        await saveRecentAccount(currentUser!.email, currentUser!.nickname, token);
        return null;
      }

      return '登录成功但获取用户信息失败';
    } catch (e) {
      print('[AuthService] 登录异常: $e');
      if (e is TimeoutException) {
        return '连接超时，请检查网络或服务器地址';
      }
      return '网络错误: ${e.toString()}';
    }
  }

  static Future<String?> register(String email, String password, String? nickname) async {
    try {
      print('[AuthService] 开始注册: $email');
      final res = await ApiClient.post('/api/auth/register', body: {
        'email': email,
        'password': password,
        'nickname': nickname,
      }, timeout: const Duration(seconds: 30));

      print('[AuthService] 注册响应状态码: ${res.statusCode}');
      print('[AuthService] 注册响应体: ${res.body}');

      if (res.statusCode != 200) {
        try {
          final data = jsonDecode(res.body);
          return data['error'] ?? '注册失败';
        } catch (_) {
          if (res.statusCode >= 500) {
            return '服务器错误，请稍后重试 (${res.statusCode})';
          }
          return '注册失败 (${res.statusCode})';
        }
      }

      final token = _extractToken(res);
      print('[AuthService] 提取到token: ${token != null ? '${token.substring(0, 20)}...' : 'null'}');

      if (token == null) {
        return '无法提取登录凭证';
      }

      await ApiClient.setToken(token);
      print('[AuthService] Token已保存');

      // 优先从响应体中直接获取用户信息
      try {
        final data = jsonDecode(res.body);
        if (data is Map<String, dynamic> && data['user'] != null) {
          currentUser = User.fromJson(data['user']);
          await saveRecentAccount(currentUser!.email, currentUser!.nickname, token);
          onAuthChecked?.call();
          print('[AuthService] 从响应体获取用户信息成功: ${currentUser?.email}');
          return null;
        }
      } catch (e) {
        print('[AuthService] 从响应体获取用户信息失败: $e');
      }

      // 如果响应体中没有用户信息，尝试 checkAuth()
      await checkAuth();
      print('[AuthService] checkAuth完成, currentUser: ${currentUser?.email}');

      if (currentUser != null) {
        await saveRecentAccount(currentUser!.email, currentUser!.nickname, token);
        return null;
      }

      return '注册成功但获取用户信息失败';
    } catch (e) {
      print('[AuthService] 注册异常: $e');
      if (e is TimeoutException) {
        return '连接超时，请检查网络或服务器地址';
      }
      return '网络错误: ${e.toString()}';
    }
  }

  static String? _extractToken(dynamic res) {
    // 方法 1: 从响应体提取 token
    try {
      final body = jsonDecode(res.body);
      if (body is Map<String, dynamic> && body.containsKey('token')) {
        return body['token'] as String;
      }
    } catch (_) {}

    // 方法 2: 从 Set-Cookie 头提取
    String? foundToken;
    res.headers.forEach((key, value) {
      if (foundToken != null) return;
      
      final valueStr = value.toString();
      if (valueStr.contains('qianren-session')) {
        final match = RegExp(r'qianren-session=([^;,\s]+)').firstMatch(valueStr);
        if (match != null) {
          foundToken = match.group(1);
        }
      }
    });

    return foundToken;
  }

  static Future<void> logout() async {
    try {
      await ApiClient.post('/api/auth/logout');
    } catch (_) {}
    await ApiClient.clearToken();
    currentUser = null;
  }
}
