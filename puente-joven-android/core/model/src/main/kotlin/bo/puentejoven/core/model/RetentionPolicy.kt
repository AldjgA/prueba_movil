package bo.puentejoven.core.model

/**
 * Política de retención local.
 *
 * En el MVP es un valor por defecto DOCUMENTADO (DECISIONES §6.2). Cuando exista
 * backend, llega desde `JurisdictionPolicy` (DECISIONES §4.4): la institución
 * puede REDUCIR el plazo; ampliarlo requiere justificación legal. La purga local
 * SIEMPRE lee de aquí, nunca hardcodea 90 días.
 */
data class RetentionPolicy(
    /** Chat personal: días desde el último acceso. */
    val chatRetentionDays: Int,
    /** Aviso de renovación, días antes del vencimiento (DECISIONES §6.2: 75). */
    val chatRenewalNoticeDays: Int,
    /** Borrador incompleto: días. */
    val draftRetentionDays: Int,
    /** Reporte personal: días. */
    val reportRetentionDays: Int,
    /** Versión de la política, para trazabilidad de auditoría. */
    val policyVersion: String,
) {
    companion object {
        /**
         * Valor por defecto del MVP, alineado con DECISIONES §6.2.
         * NO es una decisión jurídica: es un fixture local hasta que exista
         * una `JurisdictionPolicy` aprobada por la institución.
         */
        val MVP_DEFAULT = RetentionPolicy(
            chatRetentionDays = 90,
            chatRenewalNoticeDays = 75,
            draftRetentionDays = 7,
            reportRetentionDays = 90,
            policyVersion = "mvp-default-0.1",
        )
    }
}

/**
 * Resultado de una purga por retención.
 *
 * PRIVACIDAD: solo conteos y metadatos. Nunca incluye texto del chat, alias ni
 * identificadores: un resultado de purga se puede registrar sin filtrar contenido
 * (guardrail: nada de contenido sensible en logs).
 */
data class RetentionPurgeResult(
    val policy: RetentionPolicy,
    val purgedConversations: Int,
    val purgedMessages: Int,
    /** Respuestas del chequeo de contexto eliminadas (insumo del reporte). */
    val purgedResponses: Int = 0,
    /** Herramientas completadas eliminadas (reflexiones incluidas). */
    val purgedCompletions: Int = 0,
    /** Resúmenes compartibles en borrador eliminados (notas incluidas). */
    val purgedSummaries: Int = 0,
    /** Solicitudes de apoyo en borrador eliminadas. */
    val purgedDrafts: Int = 0,
    /** Accesos temporales al chat vencidos o revocados, eliminados. */
    val purgedGrants: Int = 0,
    val executedAtEpochMillis: Long,
) {
    /** `true` si la purga destruyó algo: útil para avisar al joven sin detalles. */
    val purgedAnything: Boolean
        get() = purgedConversations > 0 ||
            purgedMessages > 0 ||
            purgedResponses > 0 ||
            purgedCompletions > 0 ||
            purgedSummaries > 0 ||
            purgedDrafts > 0 ||
            purgedGrants > 0
}

/**
 * Estado de retención del contenido local, calculado con un reloj inyectable.
 *
 * @param chatDaysUntilExpiry días restantes antes de la purga automática; `null`
 *   cuando no hay contenido que pueda expirar.
 * @param needsRenewalNotice `true` cuando corresponde avisar al joven de que su
 *   contenido vencerá pronto (DECISIONES §6.2: aviso a los 75 días).
 */
data class RetentionStatus(
    val policy: RetentionPolicy,
    val chatDaysUntilExpiry: Int?,
    val needsRenewalNotice: Boolean,
    val lastChatAccessEpochMillis: Long?,
)
