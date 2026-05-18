import SwiftUI

struct NotesView: View {
    let notes: [RecipeNote]

    var body: some View {
        VStack(spacing: 0) {
            if notes.isEmpty {
                ContentUnavailableView("No notes", systemImage: "note.text")
                    .padding(.top, 40)
            } else {
                ForEach(notes) { note in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(note.title.uppercased())
                            .font(.caption2)
                            .fontWeight(.semibold)
                            .kerning(2)
                            .foregroundStyle(.orange)
                        Text(note.body)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    Divider()
                }
            }
        }
        .padding(.bottom, 32)
    }
}
