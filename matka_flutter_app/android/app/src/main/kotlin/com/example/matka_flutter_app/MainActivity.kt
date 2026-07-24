package com.example.matka_flutter_app

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val channelName = "matka/upi_intent"
    private val externalUrlChannelName = "matka/external_url"
    private val upiRequestCode = 7301
    private var pendingResult: MethodChannel.Result? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            channelName
        ).setMethodCallHandler { call, result ->
            when (call.method) {
                "startPayment" -> {
                    if (pendingResult != null) {
                        result.error("PAYMENT_RUNNING", "A UPI payment is already running", null)
                        return@setMethodCallHandler
                    }

                    val upiLink = call.argument<String>("upi_link")
                    if (upiLink.isNullOrBlank()) {
                        result.error("INVALID_UPI_LINK", "UPI link is missing", null)
                        return@setMethodCallHandler
                    }

                    startUpiIntent(upiLink, result)
                }
                else -> result.notImplemented()
            }
        }

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            externalUrlChannelName
        ).setMethodCallHandler { call, result ->
            when (call.method) {
                "openExternalUrl" -> {
                    val url = call.argument<String>("url")
                    if (url.isNullOrBlank()) {
                        result.error("INVALID_URL", "External URL is missing", null)
                        return@setMethodCallHandler
                    }
                    openExternalUrl(url, result)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun openExternalUrl(url: String, result: MethodChannel.Result) {
        try {
            val intent = if (url.startsWith("intent://")) {
                Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
            } else {
                Intent(Intent.ACTION_VIEW, Uri.parse(url))
            }

            if (
                url.startsWith("whatsapp://") ||
                url.contains("api.whatsapp.com") ||
                url.contains("wa.me/")
            ) {
                intent.setPackage("com.whatsapp")
            }

            startActivity(intent)
            result.success(null)
        } catch (error: ActivityNotFoundException) {
            try {
                val fallbackUrl = if (url.startsWith("intent://")) {
                    Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                        .getStringExtra("browser_fallback_url")
                } else {
                    url
                }

                if (fallbackUrl.isNullOrBlank()) {
                    result.error("APP_NOT_FOUND", "Required app is not installed", null)
                    return
                }

                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(fallbackUrl)))
                result.success(null)
            } catch (fallbackError: Exception) {
                result.error(
                    "OPEN_URL_ERROR",
                    fallbackError.message ?: "Unable to open external app",
                    null
                )
            }
        } catch (error: Exception) {
            result.error(
                "OPEN_URL_ERROR",
                error.message ?: "Unable to open external app",
                null
            )
        }
    }

    private fun startUpiIntent(upiLink: String, result: MethodChannel.Result) {
        pendingResult = result

        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(upiLink))
            val chooser = Intent.createChooser(intent, "Pay with UPI")
            startActivityForResult(chooser, upiRequestCode)
        } catch (error: ActivityNotFoundException) {
            pendingResult = null
            result.error("NO_UPI_APP", "No UPI app found on this device", null)
        } catch (error: Exception) {
            pendingResult = null
            result.error("UPI_ERROR", error.message ?: "Unable to open UPI app", null)
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        if (requestCode != upiRequestCode) return

        val response = data?.getStringExtra("response")
            ?: data?.dataString
            ?: if (resultCode == Activity.RESULT_CANCELED) {
                "Status=FAILED&message=Payment cancelled"
            } else {
                "Status=PENDING&message=No response from UPI app"
            }

        pendingResult?.success(response)
        pendingResult = null
    }
}
