//
//  PlanningDataService.swift
//  PlanningWidget
//
//  Service pour gérer les données du widget Planning
//

import Foundation
import WidgetKit

class PlanningDataService {
    static let shared = PlanningDataService()
    
    // App Group ID - doit correspondre à celui configuré dans les entitlements
    private let appGroupID = "group.com.nyth.planning"
    private let widgetDataKey = "widget_planning_data"
    
    private var sharedDefaults: UserDefaults? {
        return UserDefaults(suiteName: appGroupID)
    }
    
    private init() {}
    
    // MARK: - Load Data
    func loadCurrentData() -> (events: [PlanningEvent], tasks: [PlanningTask], goals: [PlanningGoal]) {
        guard let sharedDefaults = sharedDefaults,
              let jsonData = sharedDefaults.data(forKey: widgetDataKey) else {
            print("❌ Impossible de charger les données du widget")
            return ([], [], [])
        }
        
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let widgetData = try decoder.decode(PlanningWidgetData.self, from: jsonData)
            
            // Filtrer les événements du jour
            let todayEvents = widgetData.events.filter { event in
                Calendar.current.isDateInToday(event.startDate)
            }.sorted { $0.startDate < $1.startDate }
            
            // Filtrer les tâches non complétées
            let activeTasks = widgetData.tasks.filter { !$0.isCompleted }
                .sorted { task1, task2 in
                    // Trier par date d'échéance
                    if let date1 = task1.dueDate, let date2 = task2.dueDate {
                        return date1 < date2
                    }
                    return task1.dueDate != nil
                }
            
            // Les objectifs sont déjà filtrés côté app
            let activeGoals = widgetData.goals
            
            return (todayEvents, activeTasks, activeGoals)
        } catch {
            print("❌ Erreur lors du décodage des données: \(error)")
            return ([], [], [])
        }
    }
    
    // MARK: - Handle Actions
    func handleWidgetAction(url: URL) {
        guard let sharedDefaults = sharedDefaults else { return }
        
        let pathComponents = url.pathComponents
        
        if pathComponents.count >= 3 {
            let action = pathComponents[1]
            
            switch action {
            case "event":
                handleEventAction(eventId: pathComponents[2], action: pathComponents.safe(3) ?? "")
            case "task":
                handleTaskAction(taskId: pathComponents[2], action: pathComponents.safe(3) ?? "")
            case "goal":
                handleGoalAction(goalId: pathComponents[2], action: pathComponents.safe(3) ?? "")
            case "add-event", "add-task", "add-goal", "add":
                // Ces actions seront gérées par l'app principale
                sharedDefaults.set(action, forKey: "widget_last_action")
            default:
                break
            }
        }
        
        // Recharger le widget après l'action
        WidgetCenter.shared.reloadAllTimelines()
    }
    
    private func handleEventAction(eventId: String, action: String) {
        guard let sharedDefaults = sharedDefaults else { return }
        
        // Sauvegarder l'action pour que l'app principale puisse la traiter
        sharedDefaults.set("event_\(action)", forKey: "widget_last_action")
        sharedDefaults.set(eventId, forKey: "widget_action_item_id")
    }
    
    private func handleTaskAction(taskId: String, action: String) {
        guard let sharedDefaults = sharedDefaults else { return }
        
        // Sauvegarder l'action pour que l'app principale puisse la traiter
        sharedDefaults.set("task_\(action)", forKey: "widget_last_action")
        sharedDefaults.set(taskId, forKey: "widget_action_item_id")
    }
    
    private func handleGoalAction(goalId: String, action: String) {
        guard let sharedDefaults = sharedDefaults else { return }
        
        // Sauvegarder l'action pour que l'app principale puisse la traiter
        sharedDefaults.set("goal_\(action)", forKey: "widget_last_action")
        sharedDefaults.set(goalId, forKey: "widget_action_item_id")
    }
    
    // MARK: - Sample Data
    func getSampleEvents() -> [PlanningEvent] {
        return [
            PlanningEvent(
                id: "1",
                title: "Réunion de production",
                startDate: Date().addingTimeInterval(3600),
                endDate: Date().addingTimeInterval(7200),
                location: "Studio A",
                type: .meeting,
                priority: .high,
                isCompleted: false
            ),
            PlanningEvent(
                id: "2",
                title: "Écriture du script",
                startDate: Date().addingTimeInterval(10800),
                endDate: nil,
                location: "",
                type: .scriptCreation,
                priority: .medium,
                isCompleted: false
            )
        ]
    }
    
    func getSampleTasks() -> [PlanningTask] {
        return [
            PlanningTask(
                id: "1",
                title: "Réviser le montage final",
                project: "Vidéo YouTube",
                status: .inProgress,
                dueDate: Date().addingTimeInterval(86400),
                isCompleted: false
            ),
            PlanningTask(
                id: "2",
                title: "Préparer les questions d'interview",
                project: "Podcast",
                status: .todo,
                dueDate: Date().addingTimeInterval(172800),
                isCompleted: false
            )
        ]
    }
    
    func getSampleGoals() -> [PlanningGoal] {
        return [
            PlanningGoal(
                id: "1",
                title: "Vidéos publiées",
                current: 7,
                target: 10,
                unit: "vidéos",
                deadline: Date().addingTimeInterval(604800),
                progress: 70
            ),
            PlanningGoal(
                id: "2",
                title: "Heures de montage",
                current: 15,
                target: 40,
                unit: "heures",
                deadline: nil,
                progress: 37.5
            )
        ]
    }
}

// MARK: - Array Extension
extension Array {
    subscript(safe index: Int) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}