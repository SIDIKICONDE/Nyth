//
//  PlanningModels.swift
//  PlanningWidget
//
//  Modèles de données pour le widget Planning
//

import Foundation
import SwiftUI

// MARK: - Planning Event
struct PlanningEvent: Identifiable, Codable {
    let id: String
    let title: String
    let startDate: Date
    let endDate: Date?
    let location: String
    let type: EventType
    let priority: Priority
    let isCompleted: Bool
    
    enum EventType: String, Codable {
        case scriptCreation = "script_creation"
        case editing = "editing"
        case meeting = "meeting"
        case shooting = "shooting"
        case postProduction = "post_production"
        case other = "other"
    }
    
    enum Priority: String, Codable {
        case low = "low"
        case medium = "medium"
        case high = "high"
        case urgent = "urgent"
    }
    
    // Computed properties
    var timeString: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: startDate)
    }
    
    var typeIcon: String {
        switch type {
        case .scriptCreation: return "doc.text"
        case .editing: return "scissors"
        case .meeting: return "person.2"
        case .shooting: return "video"
        case .postProduction: return "wand.and.rays"
        case .other: return "calendar"
        }
    }
    
    var typeColor: Color {
        switch type {
        case .scriptCreation: return .blue
        case .editing: return .purple
        case .meeting: return .orange
        case .shooting: return .red
        case .postProduction: return .green
        case .other: return .gray
        }
    }
    
    var priorityColor: Color {
        switch priority {
        case .low: return .green
        case .medium: return .orange
        case .high: return .red
        case .urgent: return .purple
        }
    }
    
    var priorityText: String {
        switch priority {
        case .low: return "Faible"
        case .medium: return "Moyenne"
        case .high: return "Haute"
        case .urgent: return "Urgente"
        }
    }
}

// MARK: - Planning Task
struct PlanningTask: Identifiable, Codable {
    let id: String
    let title: String
    let project: String
    let status: TaskStatus
    let dueDate: Date?
    let isCompleted: Bool
    
    enum TaskStatus: String, Codable {
        case todo = "todo"
        case inProgress = "in_progress"
        case review = "review"
        case done = "done"
    }
    
    // Computed properties
    var isOverdue: Bool {
        guard let dueDate = dueDate, !isCompleted else { return false }
        return dueDate < Date()
    }
    
    var statusText: String {
        switch status {
        case .todo: return "À faire"
        case .inProgress: return "En cours"
        case .review: return "Révision"
        case .done: return "Terminé"
        }
    }
    
    var statusColor: Color {
        switch status {
        case .todo: return .gray
        case .inProgress: return .blue
        case .review: return .orange
        case .done: return .green
        }
    }
}

// MARK: - Planning Goal
struct PlanningGoal: Identifiable, Codable {
    let id: String
    let title: String
    let current: Int
    let target: Int
    let unit: String
    let deadline: Date?
    let progress: Double
    
    // Computed properties
    var progressColor: Color {
        if progress >= 100 {
            return .green
        } else if progress >= 75 {
            return .blue
        } else if progress >= 50 {
            return .orange
        } else if progress >= 25 {
            return .yellow
        } else {
            return .red
        }
    }
}

// MARK: - Widget Data Container
struct PlanningWidgetData: Codable {
    let events: [PlanningEvent]
    let tasks: [PlanningTask]
    let goals: [PlanningGoal]
    let lastUpdate: Date
}