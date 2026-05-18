import SwiftUI

enum RecipeTab { case ingredients, steps, notes }

struct RecipeDetailView: View {
    let recipe: Recipe
    @State private var servings: Int
    @State private var tab: RecipeTab = .ingredients
    @State private var doneSteps = Set<Int>()

    init(recipe: Recipe) {
        self.recipe = recipe
        _servings = State(initialValue: recipe.servings)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Hero image
                if let url = recipe.imageUrl.flatMap(URL.init) {
                    AsyncImage(url: url) { img in
                        img.resizable().scaledToFill()
                    } placeholder: {
                        Color(.systemGray6)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 220)
                    .clipped()
                }

                // Header
                VStack(alignment: .leading, spacing: 6) {
                    if !recipe.subtitle.isEmpty {
                        Text(recipe.subtitle)
                            .font(.subheadline)
                            .italic()
                            .foregroundStyle(.secondary)
                    }
                    if !recipe.description.isEmpty {
                        Text(recipe.description)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    if !recipe.tags.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                ForEach(recipe.tags, id: \.self) { tag in
                                    Text(tag)
                                        .font(.caption2)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color(.systemGray6))
                                        .clipShape(Capsule())
                                }
                            }
                        }
                    }
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)

                Divider()

                // Macros
                MacrosBar(macros: recipe.macros)

                Divider()

                // Serving scaler
                ServingsBar(servings: $servings, base: recipe.servings)

                Divider()

                // Tab picker
                Picker("", selection: $tab) {
                    Text("Ingredients").tag(RecipeTab.ingredients)
                    Text("Steps").tag(RecipeTab.steps)
                    Text("Notes").tag(RecipeTab.notes)
                }
                .pickerStyle(.segmented)
                .padding()

                // Tab content
                switch tab {
                case .ingredients:
                    IngredientsView(groups: recipe.ingredientGroups, servings: servings, base: recipe.servings)
                case .steps:
                    StepsView(steps: recipe.steps, doneSteps: $doneSteps)
                case .notes:
                    NotesView(notes: recipe.notes)
                }
            }
        }
        .navigationTitle(recipe.title)
        .navigationBarTitleDisplayMode(.large)
    }
}

struct MacrosBar: View {
    let macros: Macros

    var body: some View {
        HStack(spacing: 0) {
            MacroCell(value: "\(macros.calories)", unit: "kcal", label: "Calories", highlight: false)
            MacroCell(value: "\(macros.protein)", unit: "g", label: "Protein", highlight: true)
            MacroCell(value: "\(macros.carbs)", unit: "g", label: "Carbs", highlight: false)
            MacroCell(value: "\(macros.fat)", unit: "g", label: "Fat", highlight: false)
            MacroCell(value: "\(macros.fiber)", unit: "g", label: "Fiber", highlight: false)
        }
        .padding(.vertical, 12)
    }
}

struct MacroCell: View {
    let value: String
    let unit: String
    let label: String
    let highlight: Bool

    var body: some View {
        VStack(spacing: 2) {
            HStack(alignment: .lastTextBaseline, spacing: 1) {
                Text(value)
                    .font(.system(.title3, design: .serif, weight: .bold))
                    .foregroundStyle(highlight ? Color.orange : Color.primary)
                Text(unit)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct ServingsBar: View {
    @Binding var servings: Int
    let base: Int

    var body: some View {
        HStack(spacing: 16) {
            Text("Servings")
                .font(.caption)
                .fontWeight(.medium)
                .foregroundStyle(.secondary)
                .textCase(.uppercase)
                .kerning(1)
            Spacer()
            HStack(spacing: 0) {
                Button { if servings > 1 { servings -= 1 } } label: {
                    Image(systemName: "minus")
                        .frame(width: 36, height: 36)
                }
                Text("\(servings)")
                    .font(.system(.body, design: .serif, weight: .bold))
                    .frame(minWidth: 36)
                Button { servings += 1 } label: {
                    Image(systemName: "plus")
                        .frame(width: 36, height: 36)
                }
            }
            .buttonStyle(.bordered)
            .tint(.primary)
        }
        .padding(.horizontal)
        .padding(.vertical, 10)
    }
}
