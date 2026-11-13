package io.github.flaviteron.daymark;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Daymark for Android: the web app, bundled inside the APK and shown in a WebView.
 * Every page request is answered from the APK's own assets, so the app works with
 * no internet and never contacts a server. Data lives in the WebView's local storage.
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/index.html";
    private static final int REQ_PICK = 1, REQ_SAVE = 2;

    private WebView web;
    private ValueCallback<Uri[]> pickCallback;
    private String pendingSave;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        int paper = night ? 0xff0e1120 : 0xfff2f3f8, surface = night ? 0xff171b2e : 0xffffffff;
        getWindow().setStatusBarColor(paper);
        getWindow().setNavigationBarColor(surface);
        if (!night) {
            int flags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= 26) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            getWindow().getDecorView().setSystemUiVisibility(flags);
        }

        web = new WebView(this);
        web.setBackgroundColor(paper);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (!HOST.equals(u.getHost())) return blocked(403, "Forbidden");
                String path = u.getPath();
                if (path == null || path.isEmpty() || path.equals("/")) path = "/index.html";
                if (path.contains("..")) return blocked(403, "Forbidden");
                try {
                    InputStream in = getAssets().open("www" + path);
                    return new WebResourceResponse(mime(path), isText(path) ? "utf-8" : null, in);
                } catch (IOException e) {
                    return blocked(404, "Not Found");
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException ignored) { }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pickCallback != null) pickCallback.onReceiveValue(null);
                pickCallback = callback;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                try {
                    startActivityForResult(i, REQ_PICK);
                } catch (ActivityNotFoundException e) {
                    pickCallback = null;
                    return false;
                }
                return true;
            }
        });

        web.addJavascriptInterface(new Bridge(), "DaymarkAndroid");
        web.loadUrl(START);
    }

    private static WebResourceResponse blocked(int code, String reason) {
        Map<String, String> headers = new HashMap<>();
        return new WebResourceResponse("text/plain", "utf-8", code, reason, headers, new ByteArrayInputStream(new byte[0]));
    }

    private static boolean isText(String p) {
        return p.endsWith(".html") || p.endsWith(".css") || p.endsWith(".js") || p.endsWith(".json")
                || p.endsWith(".webmanifest") || p.endsWith(".svg") || p.endsWith(".txt");
    }

    private static String mime(String p) {
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".js")) return "text/javascript";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".webmanifest")) return "application/manifest+json";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }

    /** Functions the web app calls for things a WebView cannot do by itself. */
    private class Bridge {
        @JavascriptInterface
        public void saveFile(final String name, final String content) {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    pendingSave = content;
                    Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType("application/json");
                    i.putExtra(Intent.EXTRA_TITLE, name);
                    try { startActivityForResult(i, REQ_SAVE); } catch (ActivityNotFoundException e) { pendingSave = null; }
                }
            });
        }

        @JavascriptInterface
        public void shareText(final String text) {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    Intent i = new Intent(Intent.ACTION_SEND);
                    i.setType("text/plain");
                    i.putExtra(Intent.EXTRA_TEXT, text);
                    try { startActivity(Intent.createChooser(i, null)); } catch (ActivityNotFoundException ignored) { }
                }
            });
        }

        @JavascriptInterface
        public void print() {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    if (pm == null) return;
                    PrintAttributes attrs = new PrintAttributes.Builder()
                            .setMediaSize(PrintAttributes.MediaSize.ISO_A4.asLandscape()).build();
                    pm.print("Daymark check-list", web.createPrintDocumentAdapter("Daymark check-list"), attrs);
                }
            });
        }
    }

    @Override
    protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        Uri uri = (result == RESULT_OK && data != null) ? data.getData() : null;
        if (request == REQ_PICK) {
            if (pickCallback != null) pickCallback.onReceiveValue(uri == null ? null : new Uri[]{uri});
            pickCallback = null;
        } else if (request == REQ_SAVE) {
            String content = pendingSave;
            pendingSave = null;
            boolean ok = false;
            if (uri != null && content != null) {
                try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                    if (out != null) {
                        out.write(content.getBytes(StandardCharsets.UTF_8));
                        ok = true;
                    }
                } catch (IOException ignored) { }
            }
            web.evaluateJavascript("window.daymarkSaved&&window.daymarkSaved(" + ok + ")", null);
        }
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.daymarkBack?window.daymarkBack():false", new ValueCallback<String>() {
            @Override public void onReceiveValue(String handled) {
                if (!"true".equals(handled)) moveTaskToBack(true);
            }
        });
    }
}
