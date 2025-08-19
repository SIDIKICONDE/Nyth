//
//  PlanningWidget.swift
//  PlanningWidget
//
//  Widget iOS pour Nyth Planning
//

import WidgetKit
import SwiftUI
import Intents

// MARK: - Provider
struct PlanningProvider: IntentTimelineProvider {
    typealias Entry = PlanningEntry
    typealias Intent = ConfigurationIntent
    
    // Placeholder - Affiché pendant le chargement initial
    func placeholder(in context: Context) -> PlanningEntry {
        PlanningEntry(date: Date(), configuration: ConfigurationIntent(), events: [], tasks: [], goals: [])
    }
    
    // Snapshot - Pour la galerie de widgets
    func getSnapshot(for configuration: ConfigurationIntent, in context: Context, completion: @escaping (PlanningEntry) -> ()) {
        let entry = PlanningEntry(
            date: Date(),
            configuration: configuration,
            events: PlanningDataService.shared.getSampleEvents(),
            tasks: PlanningDataService.shared.getSampleTasks(),
            goals: PlanningDataService.shared.getSampleGoals()
        )
        completion(entry)
    }
    
    // Timeline - Met à jour le widget périodiquement
    func getTimeline(for configuration: ConfigurationIntent, in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [PlanningEntry] = []
        
        // Charger les données depuis UserDefaults partagés
        let currentData = PlanningDataService.shared.loadCurrentData()
        
        // Créer une entrée pour maintenant
        let currentDate = Date()
        let entry = PlanningEntry(
            date: currentDate,
            configuration: configuration,
            events: currentData.events,
            tasks: currentData.tasks,
            goals: currentData.goals
        )
        entries.append(entry)
        
        // Planifier la prochaine mise à jour dans 15 minutes
        let nextUpdateDate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: entries, policy: .after(nextUpdateDate))
        completion(timeline)
    }
}

// MARK: - Entry
struct PlanningEntry: TimelineEntry {
    let date: Date
    let configuration: ConfigurationIntent
    let events: [PlanningEvent]
    let tasks: [PlanningTask]
    let goals: [PlanningGoal]
}

// MARK: - Widget Views
struct PlanningWidgetEntryView : View {
    var entry: PlanningProvider.Entry
    @Environment(\.widgetFamily) var widgetFamily
    
    var body: some View {
        switch widgetFamily {
        case .systemSmall:
            SmallPlanningView(entry: entry)
        case .systemMedium:
            MediumPlanningView(entry: entry)
        case .systemLarge:
            LargePlanningView(entry: entry)
        case .systemExtraLarge:
            ExtraLargePlanningView(entry: entry)
        default:
            MediumPlanningView(entry: entry)
        }
    }
}

// MARK: - Small Widget View
struct SmallPlanningView: View {
    let entry: PlanningEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                Image(systemName: "calendar.badge.clock")
                    .font(.title2)
                    .foregroundColor(.blue)
                Text("Planning")
                    .font(.headline)
                    .foregroundColor(.primary)
                Spacer()
            }
            
            Divider()
            
            // Prochain événement
            if let nextEvent = entry.events.first {
                VStack(alignment: .leading, spacing: 4) {
                    Text(nextEvent.title)
                        .font(.system(size: 13, weight: .semibold))
                        .lineLimit(1)
                    
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.system(size: 10))
                        Text(nextEvent.timeString)
                            .font(.system(size: 11))
                    }
                    .foregroundColor(.secondary)
                }
            } else {
                Text("Aucun événement")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Bouton d'ajout rapide
            Link(destination: URL(string: "nyth://planning/add")!) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Ajouter")
                        .font(.caption)
                }
                .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(UIColor.systemBackground))
    }
}

// MARK: - Medium Widget View
struct MediumPlanningView: View {
    let entry: PlanningEntry
    
    var body: some View {
        HStack(spacing: 16) {
            // Section Événements
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "calendar")
                        .foregroundColor(.blue)
                    Text("Événements")
                        .font(.headline)
                }
                
                Divider()
                
                if entry.events.isEmpty {
                    Text("Aucun événement")
                        .font(.caption)
                        .foregroundColor(.secondary)
                } else {
                    ForEach(entry.events.prefix(2)) { event in
                        EventRowView(event: event)
                    }
                }
                
                Spacer()
            }
            
            // Section Tâches
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "checklist")
                        .foregroundColor(.green)
                    Text("Tâches")
                        .font(.headline)
                }
                
                Divider()
                
                if entry.tasks.isEmpty {
                    Text("Aucune tâche")
                        .font(.caption)
                        .foregroundColor(.secondary)
                } else {
                    ForEach(entry.tasks.prefix(3)) { task in
                        TaskRowView(task: task)
                    }
                }
                
                Spacer()
            }
        }
        .padding()
        .background(Color(UIColor.systemBackground))
    }
}

// MARK: - Large Widget View
struct LargePlanningView: View {
    let entry: PlanningEntry
    
    var body: some View {
        VStack(spacing: 16) {
            // Header avec boutons d'action rapide
            HStack {
                Text("Mon Planning")
                    .font(.title2.bold())
                
                Spacer()
                
                HStack(spacing: 12) {
                    Link(destination: URL(string: "nyth://planning/add-event")!) {
                        Image(systemName: "calendar.badge.plus")
                            .font(.title3)
                            .foregroundColor(.blue)
                    }
                    
                    Link(destination: URL(string: "nyth://planning/add-task")!) {
                        Image(systemName: "checklist")
                            .font(.title3)
                            .foregroundColor(.green)
                    }
                    
                    Link(destination: URL(string: "nyth://planning/add-goal")!) {
                        Image(systemName: "target")
                            .font(.title3)
                            .foregroundColor(.orange)
                    }
                }
            }
            
            // Sections
            VStack(spacing: 20) {
                // Section Événements
                VStack(alignment: .leading, spacing: 8) {
                    Label("Événements du jour", systemImage: "calendar")
                        .font(.headline)
                        .foregroundColor(.blue)
                    
                    if entry.events.isEmpty {
                        Text("Aucun événement aujourd'hui")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.vertical, 8)
                    } else {
                        ForEach(entry.events.prefix(3)) { event in
                            EventDetailView(event: event)
                        }
                    }
                }
                
                // Section Tâches
                VStack(alignment: .leading, spacing: 8) {
                    Label("Tâches à faire", systemImage: "checklist")
                        .font(.headline)
                        .foregroundColor(.green)
                    
                    if entry.tasks.isEmpty {
                        Text("Aucune tâche en cours")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.vertical, 8)
                    } else {
                        ForEach(entry.tasks.prefix(4)) { task in
                            TaskDetailView(task: task)
                        }
                    }
                }
                
                // Section Objectifs
                VStack(alignment: .leading, spacing: 8) {
                    Label("Objectifs actifs", systemImage: "target")
                        .font(.headline)
                        .foregroundColor(.orange)
                    
                    if entry.goals.isEmpty {
                        Text("Aucun objectif actif")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.vertical, 8)
                    } else {
                        ForEach(entry.goals.prefix(2)) { goal in
                            GoalProgressView(goal: goal)
                        }
                    }
                }
            }
            
            Spacer()
        }
        .padding()
        .background(Color(UIColor.systemBackground))
    }
}

// MARK: - Extra Large Widget View
struct ExtraLargePlanningView: View {
    let entry: PlanningEntry
    
    var body: some View {
        // Utiliser la même vue que Large pour l'instant
        LargePlanningView(entry: entry)
    }
}

// MARK: - Main Widget
@main
struct PlanningWidget: Widget {
    let kind: String = "PlanningWidget"
    
    var body: some WidgetConfiguration {
        IntentConfiguration(kind: kind, intent: ConfigurationIntent.self, provider: PlanningProvider()) { entry in
            PlanningWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Planning Nyth")
        .description("Gérez votre planning directement depuis l'écran d'accueil")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .systemExtraLarge])
    }
}

// MARK: - Preview
struct PlanningWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            PlanningWidgetEntryView(entry: PlanningEntry(
                date: Date(),
                configuration: ConfigurationIntent(),
                events: PlanningDataService.shared.getSampleEvents(),
                tasks: PlanningDataService.shared.getSampleTasks(),
                goals: PlanningDataService.shared.getSampleGoals()
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            
            PlanningWidgetEntryView(entry: PlanningEntry(
                date: Date(),
                configuration: ConfigurationIntent(),
                events: PlanningDataService.shared.getSampleEvents(),
                tasks: PlanningDataService.shared.getSampleTasks(),
                goals: PlanningDataService.shared.getSampleGoals()
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            
            PlanningWidgetEntryView(entry: PlanningEntry(
                date: Date(),
                configuration: ConfigurationIntent(),
                events: PlanningDataService.shared.getSampleEvents(),
                tasks: PlanningDataService.shared.getSampleTasks(),
                goals: PlanningDataService.shared.getSampleGoals()
            ))
            .previewContext(WidgetPreviewContext(family: .systemLarge))
        }
    }
}