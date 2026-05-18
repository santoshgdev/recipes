import SwiftUI

struct StepsView: View {
    let steps: [RecipeStep]
    @Binding var doneSteps: Set<Int>

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                StepRow(
                    index: index,
                    step: step,
                    isDone: doneSteps.contains(index),
                    onToggle: {
                        if doneSteps.contains(index) { doneSteps.remove(index) }
                        else { doneSteps.insert(index) }
                    }
                )
            }
        }
        .padding(.bottom, 32)
    }
}

struct StepRow: View {
    let index: Int
    let step: RecipeStep
    let isDone: Bool
    let onToggle: () -> Void

    @State private var timerState: TimerState?

    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            // Number column
            VStack(spacing: 0) {
                Button(action: onToggle) {
                    ZStack {
                        Circle()
                            .strokeBorder(isDone ? Color.green : Color(.systemGray4), lineWidth: 1.5)
                            .background(Circle().fill(isDone ? Color.green : Color(.systemBackground)))
                            .frame(width: 28, height: 28)
                        if isDone {
                            Image(systemName: "checkmark")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(.white)
                        } else {
                            Text("\(index + 1)")
                                .font(.caption.monospacedDigit())
                                .fontWeight(.medium)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .buttonStyle(.plain)

                if index < 99 {
                    Rectangle()
                        .fill(Color(.systemGray5))
                        .frame(width: 1)
                        .frame(maxHeight: .infinity)
                        .padding(.vertical, 4)
                }
            }
            .frame(width: 48)
            .padding(.top, 2)

            // Content column
            VStack(alignment: .leading, spacing: 8) {
                Button(action: onToggle) {
                    Text(step.title)
                        .font(.system(.body, design: .serif, weight: .bold))
                        .foregroundStyle(isDone ? Color.secondary : Color.primary)
                        .strikethrough(isDone, color: .secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .multilineTextAlignment(.leading)
                }
                .buttonStyle(.plain)

                if !step.text.isEmpty {
                    Text(step.text)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }

                if !step.bullets.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(step.bullets, id: \.self) { bullet in
                            HStack(alignment: .top, spacing: 8) {
                                Text("—").foregroundStyle(.tertiary).font(.caption)
                                Text(bullet).font(.subheadline)
                            }
                        }
                    }
                }

                if !step.note.isEmpty {
                    Text(step.note)
                        .font(.caption)
                        .italic()
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                }

                if let seconds = step.timer {
                    TimerButton(stepTitle: step.title, totalSeconds: seconds, state: $timerState)
                }
            }
            .padding(.trailing, 16)
            .padding(.bottom, 28)
        }
        .padding(.leading, 16)
        .padding(.top, 16)
    }
}

struct TimerState {
    var remaining: Int
    var isRunning: Bool
    var notificationId: String?
}

struct TimerButton: View {
    let stepTitle: String
    let totalSeconds: Int
    @Binding var state: TimerState?

    @State private var timer: Timer?

    var label: String {
        guard let s = state else { return "⏱ \(formatTime(totalSeconds))" }
        if s.remaining == 0 { return "✓ Done" }
        return s.isRunning ? "⏸ \(formatTime(s.remaining))" : "⏱ \(formatTime(s.remaining))"
    }

    var isDone: Bool { state?.remaining == 0 }

    var body: some View {
        HStack(spacing: 8) {
            Button(label) {
                Task { await toggleTimer() }
            }
            .buttonStyle(.bordered)
            .tint(isDone ? .green : (state?.isRunning == true ? .orange : .secondary))

            if state != nil && !isDone {
                Button("↺") {
                    resetTimer()
                }
                .buttonStyle(.borderless)
                .foregroundStyle(.secondary)
            }
        }
        .font(.caption.monospacedDigit())
        .onDisappear { resetTimer() }
    }

    private func toggleTimer() async {
        if state == nil {
            state = TimerState(remaining: totalSeconds, isRunning: false, notificationId: nil)
        }
        guard var s = state else { return }

        if s.isRunning {
            timer?.invalidate(); timer = nil
            if let nid = s.notificationId { NotificationManager.shared.cancel(id: nid) }
            s.isRunning = false
            s.notificationId = nil
            state = s
        } else {
            let nid = await NotificationManager.shared.scheduleTimer(stepTitle: stepTitle, seconds: s.remaining)
            s.notificationId = nid
            s.isRunning = true
            state = s
            timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
                guard var cur = state, cur.isRunning else { return }
                cur.remaining -= 1
                if cur.remaining <= 0 {
                    cur.remaining = 0
                    cur.isRunning = false
                    timer?.invalidate(); timer = nil
                    let generator = UINotificationFeedbackGenerator()
                    generator.notificationOccurred(.success)
                }
                state = cur
            }
        }
    }

    private func resetTimer() {
        timer?.invalidate(); timer = nil
        if let nid = state?.notificationId { NotificationManager.shared.cancel(id: nid) }
        state = nil
    }

    private func formatTime(_ s: Int) -> String {
        "\(s / 60):\(String(format: "%02d", s % 60))"
    }
}
