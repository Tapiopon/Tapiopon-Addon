import { world } from "@minecraft/server";

// 特定のブロックを破壊したときのイベント
world.beforeEvents.playerBreakBlock.subscribe(e => {
    if (e.block.typeId === "tapiopon:crystal_tapiopon_block" && e.player.getGameMode() === "survival") {
        const { x, y, z } = e.block.location;
        const summonEntity = Math.random() < 0.1 ? "tapiopon:rainbow_tapiopon" : "tapiopon:crystal_tapiopon";
        e.dimension.runCommandAsync(`summon ${summonEntity} ${x} ${y} ${z}`);
    }
});

// エンティティが別のエンティティにヒットしたときのイベント
world.afterEvents.entityHitEntity.subscribe(e => {
    if (e.damagingEntity.typeId === "tapiopon:rainbow_tapiopon") {
        const directionX = e.hitEntity.location.x - e.damagingEntity.location.x;
        const directionZ = e.hitEntity.location.z - e.damagingEntity.location.z;
        const horizontalStrength = 1.5;
        const verticalStrength = 0.5;

        e.hitEntity.applyKnockback(directionX, directionZ, horizontalStrength, verticalStrength);
    }
});

// アイテム使用後の効果付与関数
function applyEffect(source, effectType, duration = 100, amplifier = 0) {
    source.addEffect(effectType, duration, { amplifier });
}

// アイテム使用後のイベント
world.afterEvents.itemCompleteUse.subscribe(e => {
    const effectsMap = {
        "tapiopon:black_tapiopon_ball": "minecraft:speed",
        "tapiopon:fire_tapiopon_ball": "minecraft:fire_resistance",
        "tapiopon:green_tapiopon_ball": "minecraft:absorption",
        "tapiopon:purple_tapiopon_ball": "minecraft:nausea",
        "tapiopon:water_tapiopon_ball": "minecraft:water_breathing"
    };

    const effectType = effectsMap[e.itemStack.typeId];
    if (effectType) {
        applyEffect(e.source, effectType);
    }
});
