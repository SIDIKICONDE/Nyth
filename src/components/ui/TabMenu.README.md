# TabMenu Component

A highly customizable tab navigation component for React Native with gesture support, animations, and multiple style variants.

## Features

- 🎨 Multiple style variants (default, pills, underline, segment)
- 👆 Swipe gesture support
- ✨ Smooth animations
- 📱 Responsive design
- ♿ Accessibility support
- 🎯 TypeScript support
- 📜 Scrollable tabs option
- 🏷️ Badge support
- 🚫 Disabled state support
- 🎨 Fully customizable styles

## Installation

The component is already included in the UI components library. Import it from:

```typescript
import { TabMenu } from "@/components/ui";
// or
import TabMenu from "@/components/ui/TabMenu";
```

## Basic Usage

```tsx
import React, { useState } from "react";
import { TabMenu, TabItem } from "@/components/ui";

const MyComponent = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs: TabItem[] = [
    { id: "home", label: "Home", icon: "home" },
    { id: "profile", label: "Profile", icon: "account" },
    { id: "settings", label: "Settings", icon: "cog" },
  ];

  return (
    <TabMenu tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
  );
};
```

## Props

| Prop               | Type                                               | Default     | Description                     |
| ------------------ | -------------------------------------------------- | ----------- | ------------------------------- |
| `tabs`             | `TabItem[]`                                        | Required    | Array of tab items              |
| `activeTab`        | `number`                                           | Required    | Index of the active tab         |
| `onTabChange`      | `(index: number) => void`                          | Required    | Callback when tab changes       |
| `variant`          | `'default' \| 'pills' \| 'underline' \| 'segment'` | `'default'` | Visual style variant            |
| `showIndicator`    | `boolean`                                          | `true`      | Show active tab indicator       |
| `enableSwipe`      | `boolean`                                          | `true`      | Enable swipe gestures           |
| `enableAnimation`  | `boolean`                                          | `true`      | Enable animations               |
| `containerStyle`   | `ViewStyle`                                        | -           | Custom container styles         |
| `tabStyle`         | `ViewStyle`                                        | -           | Custom tab item styles          |
| `activeTabStyle`   | `ViewStyle`                                        | -           | Custom active tab styles        |
| `labelStyle`       | `TextStyle`                                        | -           | Custom label styles             |
| `activeLabelStyle` | `TextStyle`                                        | -           | Custom active label styles      |
| `indicatorStyle`   | `ViewStyle`                                        | -           | Custom indicator styles         |
| `showIcons`        | `boolean`                                          | `true`      | Show tab icons                  |
| `iconPosition`     | `'left' \| 'top'`                                  | `'left'`    | Icon position relative to label |
| `scrollable`       | `boolean`                                          | `false`     | Enable horizontal scrolling     |
| `centered`         | `boolean`                                          | `true`      | Center tabs in container        |

## TabItem Interface

```typescript
interface TabItem {
  id: string;
  label: string;
  icon?: string; // MaterialCommunityIcons name
  badge?: number | string;
  disabled?: boolean;
}
```

## Style Variants

### Default

Basic tab style with subtle indicator.

```tsx
<TabMenu variant="default" />
```

### Pills

Modern pill-shaped tabs with elevated active state.

```tsx
<TabMenu variant="pills" />
```

### Underline

Classic underlined tabs.

```tsx
<TabMenu variant="underline" />
```

### Segment

iOS-style segmented control.

```tsx
<TabMenu variant="segment" />
```

## Advanced Examples

### Tabs with Badges

```tsx
const tabs: TabItem[] = [
  { id: "inbox", label: "Inbox", icon: "inbox", badge: 5 },
  { id: "sent", label: "Sent", icon: "send" },
  { id: "drafts", label: "Drafts", icon: "file", badge: "New" },
];
```

### Scrollable Tabs

```tsx
<TabMenu
  tabs={manyTabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  scrollable={true}
  variant="pills"
/>
```

### Custom Styling

```tsx
<TabMenu
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  containerStyle={tw`bg-purple-100 rounded-xl p-2`}
  activeTabStyle={tw`bg-purple-500`}
  activeLabelStyle={tw`text-white`}
  indicatorStyle={tw`bg-purple-500`}
/>
```

### Icon-Only Tabs

```tsx
const iconTabs: TabItem[] = [
  { id: "camera", label: "", icon: "camera" },
  { id: "image", label: "", icon: "image" },
  { id: "video", label: "", icon: "video" },
];

<TabMenu
  tabs={iconTabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  labelStyle={tw`hidden`}
/>;
```

### Vertical Icon Layout

```tsx
<TabMenu
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  iconPosition="top"
/>
```

## Using with useTabMenu Hook

For more advanced tab management, use the `useTabMenu` hook:

```tsx
import { useTabMenu } from "@/hooks/useTabMenu";

const MyComponent = () => {
  const tabs: TabItem[] = [
    { id: "home", label: "Home", icon: "home" },
    { id: "profile", label: "Profile", icon: "account" },
    { id: "settings", label: "Settings", icon: "cog" },
  ];

  const { tabMenuProps, activeTabId, setActiveTabById, nextTab, previousTab } =
    useTabMenu(tabs, {
      initialTab: 0,
      persistKey: "myTabSelection", // Optional: persist selection
      onTabChange: (index, tabId) => {
        console.log(`Tab changed to ${tabId}`);
      },
    });

  return (
    <>
      <TabMenu {...tabMenuProps} variant="pills" />

      {/* Content based on active tab */}
      {activeTabId === "home" && <HomeContent />}
      {activeTabId === "profile" && <ProfileContent />}
      {activeTabId === "settings" && <SettingsContent />}

      {/* Programmatic navigation */}
      <Button onPress={nextTab} title="Next Tab" />
      <Button onPress={previousTab} title="Previous Tab" />
    </>
  );
};
```

## Accessibility

The TabMenu component includes built-in accessibility features:

- Proper touch target sizes
- Visual feedback for interactions
- Support for disabled states
- High contrast mode support through theme integration

## Performance Considerations

- The component uses `React.memo` and `useCallback` to prevent unnecessary re-renders
- Animations use native driver for optimal performance
- For many tabs (>10), consider using the `scrollable` prop

## Theme Integration

The component automatically integrates with the app's theme context:

```tsx
// Automatically uses theme colors
<TabMenu tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
```

## Migration from Custom Implementation

If migrating from a custom tab implementation:

1. Replace custom tab logic with TabMenu component
2. Convert tab data to TabItem format
3. Use appropriate variant to match existing design
4. Apply custom styles as needed

Example migration:

```tsx
// Before
<CustomTabBar tabs={["Home", "Profile"]} />;

// After
const tabs: TabItem[] = [
  { id: "home", label: "Home" },
  { id: "profile", label: "Profile" },
];

<TabMenu tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
```
