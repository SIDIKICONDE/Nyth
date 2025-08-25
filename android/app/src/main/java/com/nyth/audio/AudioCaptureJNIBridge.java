package com.nyth.audio;

import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

/**
 * Pont JNI pour la gestion des permissions audio Android
 * Ce fichier montre comment configurer les permissions depuis le côté Java
 */
public class AudioCaptureJNIBridge {
    private static final int PERMISSION_REQUEST_CODE = 200;
    private static final String RECORD_AUDIO_PERMISSION = "android.permission.RECORD_AUDIO";

    // Référence native vers l'instance C++
    private long nativePtr = 0;

    // Callback pour notifier le résultat de la demande de permission
    public interface PermissionCallback {
        void onPermissionResult(boolean granted);
    }

    private PermissionCallback permissionCallback;

    public AudioCaptureJNIBridge() {
        // Initialiser l'instance native
        nativePtr = nativeCreate();
    }

    public void release() {
        if (nativePtr != 0) {
            nativeDestroy(nativePtr);
            nativePtr = 0;
        }
    }

    /**
     * Configure le contexte Android pour les vérifications de permissions
     */
    public void setAndroidContext(Context context) {
        if (nativePtr != 0 && context != null) {
            nativeSetAndroidContext(nativePtr, context);
        }
    }

    /**
     * Vérifie si la permission RECORD_AUDIO est accordée
     */
    public boolean hasRecordAudioPermission(Context context) {
        if (context == null) return false;

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            // Pour les versions Android < 6.0, les permissions sont accordées à l'installation
            return true;
        }

        return ContextCompat.checkSelfPermission(context, RECORD_AUDIO_PERMISSION) == PackageManager.PERMISSION_GRANTED;
    }

    /**
     * Demande la permission RECORD_AUDIO si nécessaire
     */
    public void requestRecordAudioPermission(Activity activity, PermissionCallback callback) {
        if (activity == null) {
            if (callback != null) {
                callback.onPermissionResult(false);
            }
            return;
        }

        this.permissionCallback = callback;

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            // Pour les versions Android < 6.0, pas besoin de demander la permission
            if (callback != null) {
                callback.onPermissionResult(true);
            }
            return;
        }

        if (ContextCompat.checkSelfPermission(activity, RECORD_AUDIO_PERMISSION) == PackageManager.PERMISSION_GRANTED) {
            // Permission déjà accordée
            if (callback != null) {
                callback.onPermissionResult(true);
            }
            return;
        }

        // Demander la permission
        ActivityCompat.requestPermissions(activity, new String[]{RECORD_AUDIO_PERMISSION}, PERMISSION_REQUEST_CODE);
    }

    /**
     * Méthode appelée depuis onRequestPermissionsResult de l'Activity
     */
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == PERMISSION_REQUEST_CODE && permissions.length > 0) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;

            if (permissionCallback != null) {
                permissionCallback.onPermissionResult(granted);
                permissionCallback = null; // Reset callback
            }

            // Notifier aussi le code C++ via JNI
            if (nativePtr != 0) {
                nativeOnPermissionResult(nativePtr, granted);
            }
        }
    }

    /**
     * Vérifie si l'audio est disponible sur l'appareil
     */
    public boolean isAudioAvailable(Context context) {
        if (context == null) return false;

        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (audioManager == null) return false;

        // Vérifier si l'audio est disponible
        return audioManager.getMode() != AudioManager.MODE_INVALID;
    }

    // === Méthodes natives (implémentées en C++) ===

    private native long nativeCreate();
    private native void nativeDestroy(long ptr);
    private native void nativeSetAndroidContext(long ptr, Context context);
    private native void nativeOnPermissionResult(long ptr, boolean granted);

    // === Méthodes statiques pour le chargement de la bibliothèque ===

    static {
        // Charger la bibliothèque native
        System.loadLibrary("nyth-audio");
    }
}
