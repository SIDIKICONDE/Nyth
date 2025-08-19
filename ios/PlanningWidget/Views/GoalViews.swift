//
//  GoalViews.swift
//  PlanningWidget
//
//  Vues pour afficher les objectifs dans le widget
//

import SwiftUI

// MARK: - Goal Progress View
struct GoalProgressView: View {
    let goal: PlanningGoal
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Titre et action
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(goal.title)
                        .font(.system(size: 14, weight: .semibold))
                        .lineLimit(1)
                    
                    Text("\(goal.current) / \(goal.target) \(goal.unit)")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Boutons d'action rapide
                HStack(spacing: 12) {
                    Link(destination: URL(string: "nyth://planning/goal/\(goal.id)/decrement")!) {
                        Image(systemName: "minus.circle.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.red)
                    }
                    
                    Link(destination: URL(string: "nyth://planning/goal/\(goal.id)/increment")!) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.green)
                    }
                }
            }
            
            // Barre de progression
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // Fond
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(UIColor.systemGray5))
                        .frame(height: 8)
                    
                    // Progression
                    RoundedRectangle(cornerRadius: 4)
                        .fill(goal.progressColor)
                        .frame(width: geometry.size.width * CGFloat(goal.progress) / 100, height: 8)
                        .animation(.easeInOut(duration: 0.3), value: goal.progress)
                }
            }
            .frame(height: 8)
            
            // Infos supplémentaires
            HStack {
                // Progression en pourcentage
                Text("\(Int(goal.progress))%")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(goal.progressColor)
                
                Spacer()
                
                // Deadline si disponible
                if let deadline = goal.deadline {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                            .font(.system(size: 10))
                        Text(deadline, style: .date)
                            .font(.system(size: 11))
                    }
                    .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(10)
    }
}