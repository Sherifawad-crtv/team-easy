import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Labeled form field. Passwords get a show/hide toggle.
class TeTextField extends StatefulWidget {
  const TeTextField({
    required this.label,
    this.controller,
    this.validator,
    this.keyboardType,
    this.textInputAction,
    this.autofillHints,
    this.helperText,
    this.errorText,
    this.isPassword = false,
    this.enabled = true,
    this.textCapitalization = TextCapitalization.none,
    this.inputFormatters,
    this.onSubmitted,
    this.onChanged,
    super.key,
  });

  final String label;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final String? helperText;
  final String? errorText;
  final bool isPassword;
  final bool enabled;
  final TextCapitalization textCapitalization;
  final List<TextInputFormatter>? inputFormatters;
  final ValueChanged<String>? onSubmitted;
  final ValueChanged<String>? onChanged;

  @override
  State<TeTextField> createState() => _TeTextFieldState();
}

class _TeTextFieldState extends State<TeTextField> {
  var _hidden = true;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      validator: widget.validator,
      enabled: widget.enabled,
      keyboardType: widget.keyboardType,
      textInputAction: widget.textInputAction,
      autofillHints: widget.autofillHints,
      textCapitalization: widget.textCapitalization,
      inputFormatters: widget.inputFormatters,
      obscureText: widget.isPassword && _hidden,
      autocorrect: !widget.isPassword,
      enableSuggestions: !widget.isPassword,
      onFieldSubmitted: widget.onSubmitted,
      onChanged: widget.onChanged,
      decoration: InputDecoration(
        labelText: widget.label,
        helperText: widget.helperText,
        errorText: widget.errorText,
        helperMaxLines: 2,
        errorMaxLines: 2,
        suffixIcon: widget.isPassword
            ? IconButton(
                tooltip: _hidden ? 'Show password' : 'Hide password',
                icon: Icon(
                  _hidden
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                ),
                onPressed: () => setState(() => _hidden = !_hidden),
              )
            : null,
      ),
    );
  }
}
