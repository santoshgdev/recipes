import FirebaseFirestore

@Observable
class RecipeStore {
    var recipes: [Recipe] = []
    var isLoading = false
    var error: String?

    private let db = Firestore.firestore()

    func fetchRecipes() async {
        isLoading = true
        error = nil
        do {
            let snapshot = try await db.collection("recipes").getDocuments()
            let fetched = snapshot.documents.compactMap { doc -> Recipe? in
                try? doc.data(as: Recipe.self)
            }
            recipes = fetched.sorted {
                let a = categoryOrder.firstIndex(of: $0.category) ?? 99
                let b = categoryOrder.firstIndex(of: $1.category) ?? 99
                return a == b ? $0.title < $1.title : a < b
            }
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
