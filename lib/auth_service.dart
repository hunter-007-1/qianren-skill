import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'models.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static User? currentUser;
  static bool isLoading = true;

  static Future<void> checkAuth() async {
    isLoading = true;
    try {
      final res = await http.get(
        Uri.parse('https://qianren-skill.up.railway.app/api/auth/me'),
        headers: {'Content-Type': 'application/json'},
      );
      if (res.statusCode == 200) {
        currentUser = User.fromJson(jsonDecode(res.body));
      } else {
        currentUser = null;
      }
    } catch (e) {
      currentUser = null;
    }
    isLoading = false;
  }

  static Future<bool> login(String email, String password) async {
    try {
      final res = await http.post(
        Uri.parse('https://qianren-skill.up.railway.app/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      final setCookie = res.headers['set-cookie'];
      final tokenMatch = RegExp(r'qianren-session=([^;]+)').firstMatch(setCookie ?? '');
      if (tokenMatch != null) {
        final token = tokenMatch.group(1);
        await ApiClient.setToken(token!);
        await checkAuth();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  static Future<bool> register(String email, String password, String? nickname) async {
    try {
      final res = await http.post(
        Uri.parse('https://qianren-skill.up.railway.app/api/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password, 'nickname': nickname}),
      );

      final setCookie = res.headers['set-cookie'];
      final tokenMatch = RegExp(r'qianren-session=([^;]+)').firstMatch(setCookie ?? '');
      if (tokenMatch != null) {
        final token = tokenMatch.group(1);
        await ApiClient.setToken(token!);
        await checkAuth();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  static Future<void> logout() async {
    try {
      await http.post(
        Uri.parse('https://qianren-skill.up.railway.app/api/auth/logout'),
      );
    } catch (_) {}
    await ApiClient.clearToken();
    currentUser = null;
  }
}