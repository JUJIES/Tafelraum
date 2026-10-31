//! A fixed callback into the requesting Room frame, never a general JS evaluator.
//! WKWebView's public frame-specific evaluation preserves native activation;
//! asynchronous cross-window postMessage alone cannot enter video fullscreen.
use objc2::{
    define_class, msg_send, rc::Retained, runtime::ProtocolObject, MainThreadMarker, MainThreadOnly,
};
use objc2_foundation::{NSObject, NSObjectProtocol, NSString};
use objc2_web_kit::{
    WKContentWorld, WKScriptMessage, WKScriptMessageHandler, WKUserContentController, WKWebView,
};
use url::Url;

fn valid_request(room: &str, frame: &str, request: &str) -> bool {
    let (Ok(room), Ok(frame)) = (Url::parse(room), Url::parse(frame)) else {
        return false;
    };
    let parts: Vec<_> = frame.path_segments().into_iter().flatten().collect();
    room.scheme() == "http"
        && room.host_str() == Some("127.0.0.1")
        && room.path() == "/room.html"
        && room.origin() == frame.origin()
        && frame
            .query_pairs()
            .filter(|(key, _)| key == "tafelraum-playback")
            .map(|(_, value)| value.into_owned())
            .collect::<Vec<_>>()
            == ["output"]
        && parts.len() >= 5
        && parts[0] == "__material"
        && parts[1].len() == 64
        && parts[1].bytes().all(|byte| byte.is_ascii_hexdigit())
        && request.len() == 36
        && request.bytes().enumerate().all(|(i, byte)| {
            if [8, 13, 18, 23].contains(&i) {
                byte == b'-'
            } else {
                byte.is_ascii_hexdigit()
            }
        })
}

define_class!(
    #[unsafe(super(NSObject))]
    #[thread_kind = MainThreadOnly]
    struct RoomFullscreenRelay;
    unsafe impl NSObjectProtocol for RoomFullscreenRelay {}
    unsafe impl WKScriptMessageHandler for RoomFullscreenRelay {
        #[unsafe(method(userContentController:didReceiveScriptMessage:))]
        unsafe fn receive(&self, _controller: &WKUserContentController, message: &WKScriptMessage) {
            let Some(webview) = message.webView() else {
                return;
            };
            let frame = message.frameInfo();
            if frame.isMainFrame() {
                return;
            }
            let body = message.body();
            let Some(request) = body.downcast_ref::<NSString>() else {
                return;
            };
            let request = request.to_string();
            let (Some(room_url), Some(frame_url)) = (webview.URL(), frame.request().URL()) else {
                return;
            };
            let (Some(room_url), Some(frame_url)) =
                (room_url.absoluteString(), frame_url.absoluteString())
            else {
                return;
            };
            if !valid_request(&room_url.to_string(), &frame_url.to_string(), &request) {
                return;
            }
            // No caller-provided script, selector, URL or fullscreen state.
            // The output bridge alone owns the pending command/lease/sequence.
            let script = NSString::from_str(&format!(
                "window.dispatchEvent(new CustomEvent('tafelraum:native-fullscreen',{{detail:'{request}'}}))"));
            webview.evaluateJavaScript_inFrame_inContentWorld_completionHandler(
                &script,
                Some(&frame),
                &WKContentWorld::pageWorld(self.mtm()),
                None,
            );
        }
    }
);

pub fn install(window: &tauri::WebviewWindow) -> Result<(), String> {
    window
        .with_webview(|webview| unsafe {
            let Some(mtm) = MainThreadMarker::new() else {
                return;
            };
            // Wry supplies this WKWebView pointer on the main thread. Its content
            // controller retains the handler; the handler retains no WebView.
            let native = &*(webview.inner() as *const WKWebView);
            let handler: Retained<RoomFullscreenRelay> =
                msg_send![RoomFullscreenRelay::alloc(mtm), init];
            native
                .configuration()
                .userContentController()
                .addScriptMessageHandler_name(
                    ProtocolObject::from_ref(&*handler),
                    &NSString::from_str("tafelraumFullscreen"),
                );
        })
        .map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::valid_request;
    #[test]
    fn relay_is_confined_to_the_room_output_frame_and_a_fixed_uuid() {
        let room = "http://127.0.0.1:49627/room.html?channel=test";
        let output = format!("http://127.0.0.1:49627/__material/{}/lesson/package/index.html?tafelraum-playback=output", "a".repeat(64));
        let id = "a0000000-0000-4000-8000-000000000000";
        assert!(valid_request(room, &output, id));
        for frame in [
            output.replace("=output", "=local"),
            output.replace("49627", "49317"),
            output.replace("__material", "api/archive"),
            output.replace("=output", "=output&tafelraum-playback=local"),
            output.replace("127.0.0.1", "example.com"),
        ] {
            assert!(!valid_request(room, &frame, id));
        }
        assert!(!valid_request("http://127.0.0.1:49627/", &output, id));
        assert!(!valid_request(room, &output, "');alert(1)//"));
    }
}
