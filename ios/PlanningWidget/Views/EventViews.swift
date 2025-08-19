//
//  EventViews.swift
//  PlanningWidget
//
//  Vues pour afficher les événements dans le widget
//

import SwiftUI

// MARK: - Event Row View (pour small et medium)
struct EventRowView: View {
    let event: PlanningEvent
    
    var body: some View {
        HStack(spacing: 8) {
            // Indicateur de priorité
            Circle()
                .fill(event.priorityColor)
                .frame(width: 8, height: 8)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(event.title)
                    .font(.system(size: 13, weight: .medium))
                    .lineLimit(1)
                
                HStack(spacing: 4) {
                    Image(systemName: "clock")
                        .font(.system(size: 10))
                    Text(event.timeString)
                        .font(.system(size: 11))
                }
                .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Lien pour marquer comme complété
            Link(destination: URL(string: "nyth://planning/event/\(event.id)/toggle")!) {
                Image(systemName: event.isCompleted ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 16))
                    .foregroundColor(event.isCompleted ? .green : .gray)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Event Detail View (pour large)
struct EventDetailView: View {
    let event: PlanningEvent
    
    var body: some View {
        HStack {
            // Indicateur de type
            Image(systemName: event.typeIcon)
                .font(.title3)
                .foregroundColor(event.typeColor)
                .frame(width: 30)
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(event.title)
                        .font(.system(size: 15, weight: .semibold))
                        .lineLimit(1)
                    
                    Spacer()
                    
                    // Badge de priorité
                    Text(event.priorityText)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(event.priorityColor)
                        .cornerRadius(4)
                }
                
                HStack(spacing: 12) {
                    // Heure
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.system(size: 11))
                        Text(event.timeString)
                            .font(.system(size: 12))
                    }
                    
                    // Lieu
                    if !event.location.isEmpty {
                        HStack(spacing: 4) {
                            Image(systemName: "location")
                                .font(.system(size: 11))
                            Text(event.location)
                                .font(.system(size: 12))
                                .lineLimit(1)
                        }
                    }
                    
                    Spacer()
                    
                    // Action rapide
                    Link(destination: URL(string: "nyth://planning/event/\(event.id)/toggle")!) {
                        Image(systemName: event.isCompleted ? "checkmark.circle.fill" : "circle")
                            .font(.system(size: 18))
                            .foregroundColor(event.isCompleted ? .green : .gray)
                    }
                }
                .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(8)
    }
}