/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 *
 * Fuzzy Matching Library for Vendor Name Matching
 *
 * Provides multiple algorithms for matching vendor names:
 * - Levenshtein distance (edit distance)
 * - Token-based matching (word-by-word)
 * - Substring matching
 * - Suffix removal and normalization
 *
 * @module iq_fuzzy_matching_lib
 */
define([], function() {

    /**
     * Calculate Levenshtein distance between two strings
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Edit distance
     */
    function levenshteinDistance(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = [];

        // Initialize matrix
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }

        // Fill matrix
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }

        return matrix[len1][len2];
    }

    /**
     * Calculate similarity ratio using Levenshtein distance
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Similarity ratio (0-1)
     */
    function levenshteinSimilarity(str1, str2) {
        const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
        const maxLength = Math.max(str1.length, str2.length);
        if (maxLength === 0) return 1.0;
        return 1 - (distance / maxLength);
    }

    /**
     * Remove common business suffixes from a string
     * @param {string} name - Company name
     * @returns {string} Normalized name
     */
    function removeSuffixes(name) {
        const suffixes = [
            'inc', 'incorporated', 'llc', 'l.l.c', 'l.l.c.', 'corp', 'corporation',
            'ltd', 'limited', 'co', 'company', 'lp', 'l.p.', 'llp', 'l.l.p.',
            'pa', 'p.a.', 'pc', 'p.c.', 'pllc', 'p.l.l.c.', 'the'
        ];

        let normalized = name.toLowerCase().trim();

        // Remove punctuation
        normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
        normalized = normalized.replace(/\s{2,}/g, ' ').trim();

        // Remove suffixes
        const words = normalized.split(' ');
        const filteredWords = words.filter(word => {
            return !suffixes.includes(word.toLowerCase());
        });

        return filteredWords.join(' ').trim();
    }

    /**
     * Token-based matching - compare individual words
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Match ratio (0-1)
     */
    function tokenBasedMatch(str1, str2) {
        const tokens1 = removeSuffixes(str1).split(' ').filter(t => t.length > 0);
        const tokens2 = removeSuffixes(str2).split(' ').filter(t => t.length > 0);

        if (tokens1.length === 0 || tokens2.length === 0) return 0;

        let matchCount = 0;
        for (const token1 of tokens1) {
            for (const token2 of tokens2) {
                if (token1 === token2 ||
                    token1.includes(token2) ||
                    token2.includes(token1)) {
                    matchCount++;
                    break;
                }
            }
        }

        const totalTokens = Math.max(tokens1.length, tokens2.length);
        return matchCount / totalTokens;
    }

    /**
     * Substring matching - check if one string contains the other
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Match score (0-1)
     */
    function substringMatch(str1, str2) {
        const normalized1 = removeSuffixes(str1).toLowerCase();
        const normalized2 = removeSuffixes(str2).toLowerCase();

        if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
            // Calculate how much of the shorter string is contained
            const minLength = Math.min(normalized1.length, normalized2.length);
            const maxLength = Math.max(normalized1.length, normalized2.length);
            return minLength / maxLength;
        }

        return 0;
    }

    /**
     * Exact match (case-insensitive)
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {boolean} True if exact match
     */
    function exactMatch(str1, str2) {
        return str1.toLowerCase().trim() === str2.toLowerCase().trim();
    }

    /**
     * Normalized exact match (after removing suffixes)
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {boolean} True if normalized exact match
     */
    function normalizedExactMatch(str1, str2) {
        const normalized1 = removeSuffixes(str1);
        const normalized2 = removeSuffixes(str2);
        return normalized1 === normalized2;
    }

    /**
     * Comprehensive vendor matching using multiple algorithms
     * @param {string} targetName - Vendor name to match
     * @param {Array<Object>} vendorList - List of vendor objects with {id, name}
     * @param {number} minConfidence - Minimum confidence threshold (default 0.70)
     * @returns {Object} Best match result with {vendorId, vendorName, confidence, method}
     */
    function findBestVendorMatch(targetName, vendorList, minConfidence) {
        minConfidence = minConfidence || 0.70;

        if (!targetName || !vendorList || vendorList.length === 0) {
            return {
                vendorId: null,
                vendorName: null,
                confidence: 0,
                method: 'no_match',
                topCandidates: []
            };
        }

        const matches = [];

        // Stage 1: Exact match
        for (const vendor of vendorList) {
            if (exactMatch(targetName, vendor.name)) {
                return {
                    vendorId: vendor.id,
                    vendorName: vendor.name,
                    confidence: 1.0,
                    method: 'exact_match',
                    topCandidates: [{ id: vendor.id, name: vendor.name, score: 1.0 }]
                };
            }
        }

        // Stage 2: Normalized exact match (after suffix removal)
        for (const vendor of vendorList) {
            if (normalizedExactMatch(targetName, vendor.name)) {
                return {
                    vendorId: vendor.id,
                    vendorName: vendor.name,
                    confidence: 0.98,
                    method: 'normalized_exact_match',
                    topCandidates: [{ id: vendor.id, name: vendor.name, score: 0.98 }]
                };
            }
        }

        // Stage 3: Fuzzy matching with multiple algorithms
        for (const vendor of vendorList) {
            const levenshteinScore = levenshteinSimilarity(targetName, vendor.name);
            const tokenScore = tokenBasedMatch(targetName, vendor.name);
            const substringScore = substringMatch(targetName, vendor.name);

            // Weighted average (Levenshtein is most reliable)
            const combinedScore = (
                levenshteinScore * 0.5 +
                tokenScore * 0.3 +
                substringScore * 0.2
            );

            if (combinedScore >= minConfidence) {
                matches.push({
                    id: vendor.id,
                    name: vendor.name,
                    score: combinedScore,
                    breakdown: {
                        levenshtein: levenshteinScore,
                        token: tokenScore,
                        substring: substringScore
                    }
                });
            }
        }

        // Sort by score descending
        matches.sort((a, b) => b.score - a.score);

        // Get top 5 candidates
        const topCandidates = matches.slice(0, 5).map(m => ({
            id: m.id,
            name: m.name,
            score: Math.round(m.score * 100) / 100
        }));

        if (matches.length > 0) {
            const bestMatch = matches[0];
            return {
                vendorId: bestMatch.id,
                vendorName: bestMatch.name,
                confidence: Math.round(bestMatch.score * 100) / 100,
                method: 'fuzzy_match',
                breakdown: bestMatch.breakdown,
                topCandidates: topCandidates
            };
        }

        return {
            vendorId: null,
            vendorName: null,
            confidence: 0,
            method: 'no_match',
            topCandidates: topCandidates.length > 0 ? topCandidates : []
        };
    }

    /**
     * Match vendor name against a single vendor (for testing)
     * @param {string} targetName - Name to match
     * @param {string} vendorName - Vendor name to compare
     * @returns {Object} Match scores
     */
    function matchSingle(targetName, vendorName) {
        return {
            exact: exactMatch(targetName, vendorName),
            normalizedExact: normalizedExactMatch(targetName, vendorName),
            levenshtein: Math.round(levenshteinSimilarity(targetName, vendorName) * 100) / 100,
            token: Math.round(tokenBasedMatch(targetName, vendorName) * 100) / 100,
            substring: Math.round(substringMatch(targetName, vendorName) * 100) / 100
        };
    }

    // Public API
    return {
        levenshteinDistance: levenshteinDistance,
        levenshteinSimilarity: levenshteinSimilarity,
        removeSuffixes: removeSuffixes,
        tokenBasedMatch: tokenBasedMatch,
        substringMatch: substringMatch,
        exactMatch: exactMatch,
        normalizedExactMatch: normalizedExactMatch,
        findBestVendorMatch: findBestVendorMatch,
        matchSingle: matchSingle
    };
});
