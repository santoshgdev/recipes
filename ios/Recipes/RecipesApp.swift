import SwiftUI
import FirebaseCore

@main
struct RecipesApp: App {
    init() {
        FirebaseApp.configure()
    }

    var body: some Scene {
        WindowGroup {
            RecipeListView()
        }
    }
}
