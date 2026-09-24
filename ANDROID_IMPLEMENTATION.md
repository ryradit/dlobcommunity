# DLOB Community Mobile App - Implementation Guide (Android Native)

This document provides the end-to-end technical specification, architecture, database mapping, dependency setup, and code blueprints to build the native Android version of **DLOB Community** using **Kotlin** and **Jetpack Compose** in Android Studio.

---

## 1. Architecture Overview

The application follows **Clean Architecture** combined with **MVI (Model-View-Intent) / MVVM** using unidirectional data flow:

```
┌─────────────────────────────────────────────────────────────┐
│                       Presentation Layer                    │
│   Jetpack Compose UI  ◄── StateFlow ──►  Jetpack ViewModels │
└──────────────────────────────▲──────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────┐
│                         Domain Layer                        │
│             UseCases / Business Rules / Models              │
│       (Pricing Calculation, Membership Rules, Auth)         │
└──────────────────────────────▲──────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────┐
│                         Data Layer                          │
│     Repositories ◄──► Supabase SDK / Room DB Cache / Ktor   │
└─────────────────────────────────────────────────────────────┘
```

- **UI**: Jetpack Compose + Material 3 (Zinc Dark Theme & Royal Blue accents).
- **Dependency Injection**: Dagger Hilt.
- **Backend & Realtime**: Supabase Kotlin SDK (Auth, Postgrest, Realtime, Storage).
- **Local Persistence**: Room Database (Offline match caching & user session).
- **Asynchronous Flow**: Kotlin Coroutines & `StateFlow`.
- **Image Handling**: Coil Compose + CameraX / Image Picker for payment receipts.

---

## 2. Project Directory Structure

```
app/src/main/java/com/dlob/community/
├── DlobApplication.kt
├── di/
│   ├── NetworkModule.kt          // Supabase Client & Ktor
│   ├── DatabaseModule.kt         // Room DB
│   └── RepositoryModule.kt       // Hilt repository bindings
├── data/
│   ├── local/
│   │   ├── AppDatabase.kt
│   │   ├── dao/                  // MatchDao, ProfileDao, SettingsDao
│   │   └── entity/               // MatchEntity, ProfileEntity
│   ├── remote/
│   │   ├── SupabaseClientProvider.kt
│   │   └── dto/                  // MatchDto, MemberDto, PaymentDto
│   └── repository/
│       ├── AuthRepositoryImpl.kt
│       ├── MatchRepositoryImpl.kt
│       ├── PricingRepositoryImpl.kt
│       └── StoreRepositoryImpl.kt
├── domain/
│   ├── model/
│   │   ├── BranchPricing.kt
│   │   ├── Match.kt
│   │   ├── MatchMember.kt
│   │   ├── Profile.kt
│   │   └── Merchandise.kt
│   ├── repository/
│   └── usecase/
│       ├── GetBranchPricingUseCase.kt
│       ├── CalculateMatchFeeUseCase.kt
│       ├── CreateMatchUseCase.kt
│       └── UploadPaymentProofUseCase.kt
├── ui/
│   ├── theme/
│   │   ├── Color.kt
│   │   ├── Theme.kt
│   │   └── Type.kt
│   ├── navigation/
│   │   ├── Screen.kt
│   │   └── AppNavGraph.kt
│   ├── components/
│   │   ├── DlobButton.kt
│   │   ├── StatusBadge.kt
│   │   ├── RadarChart.kt
│   │   └── ProofUploadSheet.kt
│   └── screens/
│       ├── auth/                 // Login, Register, BranchSelection
│       ├── home/                 // Home feed, Sparring countdown
│       ├── matches/              // Match list, Create Match bottom sheet
│       ├── payment/              // Pembayaran breakdown, Upload proof
│       ├── playercard/           // Digital FUT-style Player Card
│       ├── leaderboard/          // Leaderboard & Rank list
│       ├── store/                // Jersey pre-order catalog & checkout
│       └── admin/                // Branch fee settings & Member verification
```

---

## 3. Dependency Configuration (`build.gradle.kts`)

### `app/build.gradle.kts`
```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt.android)
}

android {
    namespace = "com.dlob.community"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.dlob.community"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        buildConfigField("String", "SUPABASE_URL", "\"https://your-supabase-project.supabase.co\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"your-anon-key\"")
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // Jetpack Compose & Material 3
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.navigation:navigation-compose:2.8.5")

    // Supabase Kotlin Multiplatform (v3.x)
    val supabaseVersion = "3.1.1"
    implementation(platform("io.github.jan-tennert.supabase:bom:$supabaseVersion"))
    implementation("io.github.jan-tennert.supabase:postgrest-kt")
    implementation("io.github.jan-tennert.supabase:gotrue-kt")
    implementation("io.github.jan-tennert.supabase:storage-kt")
    implementation("io.github.jan-tennert.supabase:realtime-kt")
    implementation("io.ktor:ktor-client-android:3.0.3")

    // Dagger Hilt
    implementation("com.google.dagger:hilt-android:2.54")
    ksp("com.google.dagger:hilt-compiler:2.54")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    // Room Database
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    // Coil for Image Loading
    implementation("io.coil-kt:coil-compose:2.7.0")

    // KotlinX Serialization & Datetime
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.6.1")
}
```

---

## 4. Multi-Branch Pricing Domain Engine

Mirrors the web calculation logic between **DLOB Pusat** and **DLBC Cikupa**:

```kotlin
package com.dlob.community.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class BranchPricing(
    val branchId: String,
    val shuttlecockFee: Long,
    val attendanceFee: Long,
    val costPerMemberPerCock: Long
)

object PricingDefaults {
    val PUSAT = BranchPricing(
        branchId = "dlob-pusat",
        shuttlecockFee = 12_000L,        // Rp 12.000 / cock (total)
        attendanceFee = 18_000L,         // Rp 18.000 / day
        costPerMemberPerCock = 3_000L    // Rp 12.000 / 4 players
    )

    val CIKUPA = BranchPricing(
        branchId = "dlob-cikupa",
        shuttlecockFee = 2_500L,         // Rp 2.500 / member / cock
        attendanceFee = 12_000L,         // Rp 12.000 / day
        costPerMemberPerCock = 2_500L
    )
}
```

### Calculation UseCase
```kotlin
package com.dlob.community.domain.usecase

import com.dlob.community.domain.model.BranchPricing
import javax.inject.Inject

class CalculateMatchFeeUseCase @Inject constructor() {
    
    data class PlayerCostBreakdown(
        val memberName: String,
        val shuttlecockCost: Long,
        val attendanceCost: Long,
        val totalDue: Long
    )

    fun execute(
        pricing: BranchPricing,
        shuttlecockCount: Int,
        memberName: String,
        isPaymentExempt: Boolean,
        hasMonthlyMembership: Boolean,
        alreadyPaidAttendanceToday: Boolean
    ): PlayerCostBreakdown {
        if (isPaymentExempt) {
            return PlayerCostBreakdown(memberName, 0L, 0L, 0L)
        }

        val cockCost = if (pricing.branchId == "dlob-cikupa") {
            shuttlecockCount * pricing.costPerMemberPerCock
        } else {
            (shuttlecockCount * pricing.shuttlecockFee) / 4
        }

        val attendanceCost = if (hasMonthlyMembership || alreadyPaidAttendanceToday) {
            0L
        } else {
            pricing.attendanceFee
        }

        return PlayerCostBreakdown(
            memberName = memberName,
            shuttlecockCost = cockCost,
            attendanceCost = attendanceCost,
            totalDue = cockCost + attendanceCost
        )
    }
}
```

---

## 5. Supabase Client & Remote Settings Repository

### `SupabaseClientProvider.kt`
```kotlin
package com.dlob.community.data.remote

import com.dlob.community.BuildConfig
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.storage.Storage
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SupabaseClientProvider @Inject constructor() {
    val client: SupabaseClient = createSupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY
    ) {
        install(Auth)
        install(Postgrest)
        install(Storage)
        install(Realtime)
    }
}
```

### Dynamic Pricing Repository
```kotlin
package com.dlob.community.data.repository

import com.dlob.community.domain.model.BranchPricing
import com.dlob.community.domain.model.PricingDefaults
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.Serializable
import javax.inject.Inject

@Serializable
data class AppSettingDto(val key: String, val value: String)

class PricingRepositoryImpl @Inject constructor(
    private val supabase: SupabaseClient
) {
    suspend fun getBranchPricing(branchId: String): BranchPricing {
        val defaultPricing = if (branchId == "dlob-cikupa") PricingDefaults.CIKUPA else PricingDefaults.PUSAT
        
        return try {
            val cockKey = "shuttlecock_fee_$branchId"
            val attendanceKey = "attendance_fee_$branchId"

            val settings = supabase.postgrest["app_settings"]
                .select {
                    filter {
                        isIn("key", listOf(cockKey, attendanceKey))
                    }
                }
                .decodeList<AppSettingDto>()
                .associate { it.key to it.value }

            val cockFee = settings[cockKey]?.toLongOrNull() ?: defaultPricing.shuttlecockFee
            val attFee = settings[attendanceKey]?.toLongOrNull() ?: defaultPricing.attendanceFee

            val perMemberPerCock = if (branchId == "dlob-cikupa") cockFee else cockFee / 4

            BranchPricing(
                branchId = branchId,
                shuttlecockFee = cockFee,
                attendanceFee = attFee,
                costPerMemberPerCock = perMemberPerCock
            )
        } catch (e: Exception) {
            defaultPricing
        }
    }
}
```

---

## 6. Jetpack Compose Theme & UI Components

### Dark Design Palette (`Color.kt`)
```kotlin
package com.dlob.community.ui.theme

import androidx.compose.ui.graphics.Color

val DarkBackground = Color(0xFF09090B)   // Zinc 950
val DarkSurface = Color(0xFF18181B)      // Zinc 900
val DarkSurfaceVariant = Color(0xFF27272A)// Zinc 800
val DarkBorder = Color(0xFF3F3F46)       // Zinc 700

val DlobBluePrimary = Color(0xFF2563EB)   // Electric Royal Blue
val DlobBlueLight = Color(0xFF60A5FA)     // Light Accent
val EmeraldPaid = Color(0xFF10B981)       // Paid status
val AmberPending = Color(0xFFF59E0B)      // Pending status
val RoseRejected = Color(0xFFEF4444)      // Rejected status
```

### Match Card Composable (`MatchCard.kt`)
```kotlin
package com.dlob.community.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dlob.community.ui.theme.*

@Composable
fun MatchCard(
    matchNumber: Int,
    shuttlecockCount: Int,
    totalPerPerson: Long,
    players: List<String>,
    onPaymentClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .border(1.dp, DarkBorder, RoundedCornerShape(16.dp)),
        colors = CardDefaults.cardColors(containerColor = DarkSurface),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Match #$matchNumber",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = Color.White
                )
                Text(
                    text = "$shuttlecockCount Cock",
                    color = DlobBlueLight,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            players.chunked(2).forEach { rowPlayers ->
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    rowPlayers.forEach { player ->
                        Text(
                            text = "• $player",
                            color = Color.LightGray,
                            fontSize = 14.sp,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))
            }

            Spacer(modifier = Modifier.height(12.dp))
            Divider(color = DarkBorder)
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Total / Orang", fontSize = 12.sp, color = Color.Gray)
                    Text(
                        "Rp ${"%,d".format(totalPerPerson).replace(',', '.')}",
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = 16.sp
                    )
                }

                Button(
                    onClick = onPaymentClick,
                    colors = ButtonDefaults.buttonColors(containerColor = DlobBluePrimary),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Detail & Bayar", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
```

---

## 7. FUT-Style Player Card Screen (`PlayerCardScreen.kt`)

Renders a FIFA/FUT-style badminton card with rank badge and stats:

```kotlin
package com.dlob.community.ui.screens.playercard

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dlob.community.ui.theme.DlobBluePrimary

@Composable
fun PlayerCard(
    fullName: String,
    rating: Int,
    tier: String,
    smash: Int,
    defense: Int,
    stamina: Int,
    agility: Int,
    teamplay: Int
) {
    Box(
        modifier = Modifier
            .width(300.dp)
            .height(440.dp)
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(Color(0xFF1E293B), Color(0xFF0F172A), Color(0xFF020617))
                ),
                shape = RoundedCornerShape(24.dp)
            )
            .border(2.dp, Brush.linearGradient(listOf(DlobBluePrimary, Color(0xFF93C5FD))), RoundedCornerShape(24.dp))
            .padding(20.dp)
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = "$rating", fontSize = 36.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                    Text(text = tier.uppercase(), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF60A5FA))
                }
                Text("DLOB", fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White)
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = fullName,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )

            Spacer(modifier = Modifier.height(20.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatColumn(label = "SMS", value = smash)
                StatColumn(label = "DEF", value = defense)
                StatColumn(label = "STM", value = stamina)
                StatColumn(label = "AGI", value = agility)
                StatColumn(label = "TMP", value = teamplay)
            }
        }
    }
}

@Composable
private fun StatColumn(label: String, value: Int) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "$value", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Text(text = label, fontSize = 11.sp, color = Color.Gray)
    }
}
```

---

## 8. Step-by-Step Android Studio Setup

1. **New Project**:
   - Open Android Studio -> New Project -> **Empty Compose Activity**.
   - Package name: `com.dlob.community`.
   - Minimum SDK: API 24 (Android 7.0) or higher.
   - Build Configuration Language: **Kotlin DSL (`build.gradle.kts`)**.

2. **Add Permissions (`AndroidManifest.xml`)**:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
   ```

3. **Configure Environment Variables**:
   - Add your Supabase URL & Anon Key to `local.properties` or directly in `app/build.gradle.kts`.

4. **Run and Verify**:
   - Run the project on an Android Emulator or physical device.
   - Test login with Supabase Auth, verify branch switcher switches pricing rules, and test match listing.
