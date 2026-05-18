import Foundation

struct Recipe: Identifiable, Codable {
    var id: String
    var title: String
    var subtitle: String
    var description: String
    var category: String
    var tags: [String]
    var servings: Int
    var macros: Macros
    var ingredientGroups: [IngredientGroup]
    var steps: [RecipeStep]
    var notes: [RecipeNote]
    var imageUrl: String?
}

struct Macros: Codable {
    var calories: Int
    var protein: Int
    var carbs: Int
    var fat: Int
    var fiber: Int
}

struct IngredientGroup: Codable, Identifiable {
    var id: String { label }
    var label: String
    var ingredients: [Ingredient]
}

struct Ingredient: Codable {
    var amount: String
    var unit: String
    var name: String
    var base: Double
    var note: String?
}

struct RecipeStep: Codable, Identifiable {
    var id: UUID = UUID()
    var title: String
    var text: String
    var bullets: [String] = []
    var note: String = ""
    var timer: Int?

    enum CodingKeys: String, CodingKey {
        case title, text, bullets, note, timer
    }
}

struct RecipeNote: Codable, Identifiable {
    var id: UUID = UUID()
    var title: String
    var body: String

    enum CodingKeys: String, CodingKey {
        case title, body
    }
}

let categoryOrder = ["Dinner", "Smoothies", "Breakfast", "Lunch", "Snack"]

func formatAmount(_ value: Double) -> String {
    let fractions: [(Double, String)] = [
        (0.25, "¼"), (0.333, "⅓"), (0.5, "½"), (0.667, "⅔"), (0.75, "¾")
    ]
    let whole = Int(value)
    let frac = value - Double(whole)
    if frac < 0.05 { return "\(whole)" }
    for (f, sym) in fractions {
        if abs(frac - f) < 0.05 { return whole > 0 ? "\(whole)\(sym)" : sym }
    }
    let rounded = (value * 10).rounded() / 10
    return rounded == rounded.rounded() ? "\(Int(rounded))" : String(format: "%.1f", rounded)
}
