package com.slash.DOF3TNA

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.Worker
import androidx.work.WorkerParameters
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response

class UpdateWorker(context: Context, workerParams: WorkerParameters) : Worker(context, workerParams) {

    companion object {
        const val CHANNEL_ID = "background_update_notifications"
        const val SITE_URL = "https://osamamabrouk0.github.io/DOF3TNA/"
        const val LAST_MODIFIED_KEY = "last_modified"
    }

    private val sharedPreferences: SharedPreferences = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)

    override fun doWork(): Result {
        val client = OkHttpClient()
        val request = Request.Builder().url(SITE_URL).head().build()

        return try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val newLastModified = response.header("Last-Modified")
                val storedLastModified = sharedPreferences.getString(LAST_MODIFIED_KEY, null)

                if (newLastModified != null && newLastModified != storedLastModified) {
                    // إذا كان المحتوى قد تغير
                    sharedPreferences.edit().putString(LAST_MODIFIED_KEY, newLastModified).apply()
                    showNotification("تحديث متاح", "تم العثور على محتوى جديد!")
                }
            }
            Result.success()
        } catch (e: Exception) {
            e.printStackTrace()
            Result.retry()
        }
    }

    @SuppressLint("MissingPermission")
    private fun showNotification(title: String, message: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "تحديثات الخلفية",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            val manager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_update)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        with(NotificationManagerCompat.from(applicationContext)) {
            notify(2, notification)
        }
    }
}
