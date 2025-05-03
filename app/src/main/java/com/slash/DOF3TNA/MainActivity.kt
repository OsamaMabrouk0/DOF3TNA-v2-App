package com.slash.DOF3TNA

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.ActivityInfo
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.*
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import java.io.File
import java.io.FileOutputStream
import java.util.*

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var fullScreenContainer: FrameLayout

    private var customView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null
    private var lastBackPressedTime: Long = 0
    private val exitInterval: Long = 2000
    private var wasOfflineOnStart = false
    private var hasRestarted = false
    private val handler = Handler(Looper.getMainLooper())

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)
        fullScreenContainer = findViewById(R.id.fullScreenContainer)

        setupWebView()

        if (!isConnectedToInternet()) {
            wasOfflineOnStart = true
        }

        loadLocalPage()

        swipeRefreshLayout.setOnRefreshListener {
            webView.reload()
        }

        webView.setOnScrollChangeListener { _, _, scrollY, _, _ ->
            swipeRefreshLayout.isEnabled = scrollY == 0
        }

        startNetworkMonitor()
    }

    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            cacheMode = WebSettings.LOAD_CACHE_ELSE_NETWORK
            setSupportMultipleWindows(true)
            allowFileAccess = true
        }

        webView.addJavascriptInterface(JSInterface(this), "AndroidInterface")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: android.webkit.WebResourceRequest?): Boolean {
                val url = request?.url.toString()
                try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                } catch (e: Exception) {
                    // عرض رسالة عند فشل فتح الرابط
                    Toast.makeText(this@MainActivity, "فشل في فتح الرابط: $url", Toast.LENGTH_LONG).show()
                }
                return true
            }

            override fun onPageFinished(view: WebView, url: String?) {
                super.onPageFinished(view, url)
                swipeRefreshLayout.isRefreshing = false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowCustomView(view: View, callback: CustomViewCallback) {
                customView = view
                customViewCallback = callback
                fullScreenContainer.addView(view)
                fullScreenContainer.visibility = View.VISIBLE
                webView.visibility = View.GONE
                supportActionBar?.hide()

                window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        or View.SYSTEM_UI_FLAG_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION)

                requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
            }

            override fun onHideCustomView() {
                fullScreenContainer.removeView(customView)
                fullScreenContainer.visibility = View.GONE
                customView = null
                customViewCallback = null
                webView.visibility = View.VISIBLE
                supportActionBar?.show()
                window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
                requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
            }
        }
    }

    private fun loadLocalPage() {
        webView.loadUrl("file:///android_asset/index.html")
    }

    private fun isConnectedToInternet(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val activeNetwork = connectivityManager.getNetworkCapabilities(network) ?: return false
            activeNetwork.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } else {
            val networkInfo = connectivityManager.activeNetworkInfo ?: return false
            networkInfo.isConnected
        }
    }

    private fun startNetworkMonitor() {
        handler.postDelayed(object : Runnable {
            override fun run() {
                if (wasOfflineOnStart && isConnectedToInternet() && !hasRestarted) {
                    hasRestarted = true
                    restartApp()
                }
                if (!hasRestarted) {
                    handler.postDelayed(this, 5000)
                }
            }
        }, 5000)
    }

    private fun restartApp() {
        val intent = Intent(this, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        startActivity(intent)
        finish()
    }

    @RequiresApi(Build.VERSION_CODES.O)
    override fun onBackPressed() {
        if (customView != null) {
            (webView.webChromeClient as WebChromeClient).onHideCustomView()
        } else if (webView.canGoBack()) {
            webView.goBack()
        } else {
            val currentTime = System.currentTimeMillis()
            if (currentTime - lastBackPressedTime < exitInterval) {
                super.onBackPressed()
            } else {
                lastBackPressedTime = currentTime
                Toast.makeText(this, "اضغط مرة أخرى للخروج من التطبيق.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private class JSInterface(private val context: Context) {
        @RequiresApi(Build.VERSION_CODES.O)
        @JavascriptInterface
        fun saveFile(fileName: String, base64Data: String) {
            try {
                val decodedBytes = Base64.getDecoder().decode(base64Data)
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val customDir = File(downloadsDir, "دفعتنا")
                if (!customDir.exists()) customDir.mkdirs()
                val file = File(customDir, fileName)
                val fos = FileOutputStream(file)
                fos.write(decodedBytes)
                fos.close()
                // إظهار رسالة النجاح عند حفظ الملف
                Toast.makeText(context, "تم حفظ الملف: $fileName", Toast.LENGTH_LONG).show()
            } catch (e: Exception) {
                // إظهار رسالة فشل عند فشل حفظ الملف
                Toast.makeText(context, "فشل حفظ الملف: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }
}
