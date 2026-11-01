import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = GameViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

/// On Dynamic Island iPhones the game hides the status bar so its top HUD can sit left and right of the island
/// (the web layout does the same check with env(safe-area-inset-top)). Notch and Home-button iPhones and iPads
/// keep the clock and battery visible.
class GameViewController: CAPBridgeViewController {
    override func viewSafeAreaInsetsDidChange() {
        super.viewSafeAreaInsetsDidChange()
        hideStatusBarBesideIsland()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        hideStatusBarBesideIsland()
    }

    private func hideStatusBarBesideIsland() {
        let topInset = view.window?.safeAreaInsets.top ?? view.safeAreaInsets.top
        let hasIsland = traitCollection.userInterfaceIdiom == .phone && topInset >= 51
        // one way only (visible -> hidden), so a changed inset can never make it flicker
        if hasIsland && isStatusBarVisible {
            setStatusBarVisible(false)
        }
    }
}

