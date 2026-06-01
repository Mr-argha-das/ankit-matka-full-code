import 'package:matka_flutter_app/main.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('web app URL is configured', () {
    expect(webAppUrl, isNotEmpty);
  });
}
