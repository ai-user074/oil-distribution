<template>
  <div>
    <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
      <ion-refresher-content></ion-refresher-content>
    </ion-refresher>

    <ion-list class="inset-list" v-if="items.length">
      <ion-item
        v-for="item in items"
        :key="item.name"
        button
        :detail="false"
        @click="$emit('item-click', item)"
        class="list-item"
      >
        <ion-label>
          <div class="item-header">
            <slot name="title" :item="item">
              <span class="item-title">{{ item.name }}</span>
            </slot>
            <ion-badge
              v-if="item.status"
              :color="statusBadgeColor(item.status)"
              class="item-badge"
            >{{ item.status }}</ion-badge>
          </div>
          <div class="item-subtitle">
            <slot name="subtitle" :item="item"></slot>
          </div>
        </ion-label>
        <div slot="end" class="item-end">
          <slot name="end" :item="item"></slot>
        </div>
      </ion-item>
    </ion-list>

    <EmptyState v-else-if="!loading" :icon="emptyStateIcon" :message="emptyStateMessage" />

    <div v-if="loading" class="loading-spinner">
      <ion-spinner name="crescent"></ion-spinner>
    </div>
  </div>
</template>

<script setup>
import { IonList, IonItem, IonLabel, IonBadge, IonRefresher, IonRefresherContent, IonSpinner } from "@ionic/vue"
import EmptyState from "./EmptyState.vue"

defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyStateIcon: { type: String, default: "document-outline" },
  emptyStateMessage: { type: String, default: "No items found" },
})
const emit = defineEmits(["item-click", "refresh"])

function statusBadgeColor(status) {
  if (!status) return "medium"
  const s = String(status).toLowerCase()
  if (s.includes("draft") || s.includes("pending") || s.includes("transfer created")) return "warning"
  if (s.includes("reserved") || s.includes("submitted") || s.includes("completed")) return "success"
  if (s.includes("release") || s.includes("cancel")) return "danger"
  return "medium"
}

function handleRefresh(event) {
  emit("refresh", event)
}
</script>

<style scoped>
.inset-list {
  margin: 0;
  border-radius: 12px;
  overflow: hidden;
}
.list-item {
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  --inner-padding-end: 0;
}
.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.item-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  min-height: 18px;
  flex-shrink: 0;
}
.item-subtitle {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}
.item-end {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 32px;
}
@media (prefers-color-scheme: dark) {
  .item-title { color: #f1f5f9; }
  .item-subtitle { color: #94a3b8; }
}
</style>
