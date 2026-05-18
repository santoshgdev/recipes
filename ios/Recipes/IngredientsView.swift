import SwiftUI

struct IngredientsView: View {
    let groups: [IngredientGroup]
    let servings: Int
    let base: Int

    var ratio: Double { Double(servings) / Double(base) }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(groups) { group in
                VStack(alignment: .leading, spacing: 0) {
                    Text(group.label.uppercased())
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .kerning(2)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal)
                        .padding(.top, 20)
                        .padding(.bottom, 8)

                    ForEach(Array(group.ingredients.enumerated()), id: \.offset) { _, ing in
                        IngredientRow(ingredient: ing, ratio: ratio)
                        Divider().padding(.leading)
                    }
                }
            }
        }
        .padding(.bottom, 32)
    }
}

struct IngredientRow: View {
    let ingredient: Ingredient
    let ratio: Double

    var scaledAmount: String {
        formatAmount(ingredient.base * ratio)
    }

    var body: some View {
        HStack(alignment: .center, spacing: 0) {
            Text(scaledAmount)
                .font(.system(.body, design: .serif, weight: .bold))
                .foregroundStyle(.orange)
                .frame(width: 52, alignment: .trailing)

            if !ingredient.unit.isEmpty {
                Text(ingredient.unit)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(.secondary)
                    .frame(width: 36, alignment: .leading)
                    .padding(.leading, 6)
            } else {
                Spacer().frame(width: 42)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(ingredient.name)
                    .font(.body)
                if let note = ingredient.note, !note.isEmpty {
                    Text(note)
                        .font(.caption)
                        .italic()
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.leading, 8)

            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 10)
    }
}
