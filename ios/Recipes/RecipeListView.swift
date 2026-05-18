import SwiftUI

struct RecipeListView: View {
    @State private var store = RecipeStore()

    var grouped: [(category: String, recipes: [Recipe])] {
        var seen = Set<String>()
        var order = categoryOrder.filter { cat in
            store.recipes.contains { $0.category == cat }
        }
        for r in store.recipes where !seen.contains(r.category) {
            seen.insert(r.category)
            if !order.contains(r.category) { order.append(r.category) }
        }
        return order.map { cat in
            (cat, store.recipes.filter { $0.category == cat })
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if store.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error = store.error {
                    ContentUnavailableView("Failed to load", systemImage: "exclamationmark.triangle", description: Text(error))
                } else {
                    List {
                        ForEach(grouped, id: \.category) { group in
                            Section(group.category.uppercased()) {
                                ForEach(group.recipes) { recipe in
                                    NavigationLink(destination: RecipeDetailView(recipe: recipe)) {
                                        RecipeRow(recipe: recipe)
                                    }
                                }
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Recipes")
            .task { await store.fetchRecipes() }
        }
    }
}

struct RecipeRow: View {
    let recipe: Recipe

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(recipe.title)
                    .font(.system(.body, design: .serif, weight: .bold))
                if !recipe.subtitle.isEmpty {
                    Text(recipe.subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .italic()
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(recipe.macros.protein)g")
                    .font(.system(.subheadline, weight: .semibold))
                    .foregroundStyle(.orange)
                Text("protein")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            if let url = recipe.imageUrl.flatMap(URL.init) {
                AsyncImage(url: url) { img in
                    img.resizable().scaledToFill()
                } placeholder: {
                    Color(.systemGray5)
                }
                .frame(width: 56, height: 44)
                .clipShape(RoundedRectangle(cornerRadius: 6))
            }
        }
        .padding(.vertical, 4)
    }
}
