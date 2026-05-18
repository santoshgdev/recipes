# iOS App Setup

## 1. Create Xcode project

1. Open Xcode → **File → New → Project**
2. Choose **iOS → App**
3. Set:
   - Product Name: `Recipes`
   - Bundle ID: anything (e.g. `com.santosh.recipes`)
   - Interface: **SwiftUI**
   - Language: **Swift**
4. Save inside `ios/` in this repo

## 2. Add Firebase via Swift Package Manager

In Xcode: **File → Add Package Dependencies**

URL: `https://github.com/firebase/firebase-ios-sdk`

Add these products:
- `FirebaseFirestore`
- `FirebaseFirestoreSwift`

## 3. Add GoogleService-Info.plist

1. Go to [Firebase Console](https://console.firebase.google.com) → Project `recipes-496701`
2. **Project Settings → Your apps → Add app → iOS**
3. Register with your bundle ID
4. Download `GoogleService-Info.plist`
5. Drag it into Xcode — check **Copy items if needed**, add to the `Recipes` target

## 4. Replace generated source files

Delete the generated `ContentView.swift` and `RecipesApp.swift` (or the app file Xcode created). Copy all `.swift` files from this directory into your Xcode project, making sure they're added to the target.

## 5. Add background notification capability

In Xcode: click the project → target **Recipes** → **Signing & Capabilities → + Capability → Push Notifications**

Also add **Background Modes** and check **Remote notifications** if you want notifications when fully closed (local notifications work without this).

## 6. Run

Build and run on a real device (not simulator) to test notifications.
