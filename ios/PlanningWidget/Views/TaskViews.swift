//
//  TaskViews.swift
//  PlanningWidget
//
//  Vues pour afficher les tâches dans le widget
//

import SwiftUI

// MARK: - Task Row View (pour small et medium)
struct TaskRowView: View {
    let task: PlanningTask
    
    var body: some View {
        HStack(spacing: 8) {
            // Checkbox
            Link(destination: URL(string: "nyth://planning/task/\(task.id)/toggle")!) {
                Image(systemName: task.isCompleted ? "checkmark.square.fill" : "square")
                    .font(.system(size: 16))
                    .foregroundColor(task.isCompleted ? .green : .gray)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(task.title)
                    .font(.system(size: 13, weight: .medium))
                    .lineLimit(1)
                    .strikethrough(task.isCompleted)
                
                if let dueDate = task.dueDate {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                            .font(.system(size: 10))
                        Text(dueDate, style: .date)
                            .font(.system(size: 11))
                    }
                    .foregroundColor(task.isOverdue ? .red : .secondary)
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Task Detail View (pour large)
struct TaskDetailView: View {
    let task: PlanningTask
    
    var body: some View {
        HStack {
            // Checkbox
            Link(destination: URL(string: "nyth://planning/task/\(task.id)/toggle")!) {
                Image(systemName: task.isCompleted ? "checkmark.square.fill" : "square")
                    .font(.system(size: 20))
                    .foregroundColor(task.isCompleted ? .green : .gray)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(task.title)
                        .font(.system(size: 15, weight: .semibold))
                        .lineLimit(1)
                        .strikethrough(task.isCompleted)
                    
                    Spacer()
                    
                    // Badge de statut
                    Text(task.statusText)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(task.statusColor)
                        .cornerRadius(4)
                }
                
                HStack(spacing: 12) {
                    // Projet
                    if !task.project.isEmpty {
                        HStack(spacing: 4) {
                            Image(systemName: "folder")
                                .font(.system(size: 11))
                            Text(task.project)
                                .font(.system(size: 12))
                        }
                    }
                    
                    // Date d'échéance
                    if let dueDate = task.dueDate {
                        HStack(spacing: 4) {
                            Image(systemName: "calendar")
                                .font(.system(size: 11))
                            Text(dueDate, style: .date)
                                .font(.system(size: 12))
                        }
                        .foregroundColor(task.isOverdue ? .red : .secondary)
                    }
                    
                    Spacer()
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