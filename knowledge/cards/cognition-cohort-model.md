---
id: "cognition-cohort-model"
title: "语音词识别的候选集模型"
english: "Cohort model of spoken-word recognition"
kind: "模型"
domain: "cognition"
subdomain: "口语理解"
summary: "词语的起始声音先激活一组可能候选，随后到来的声音逐渐排除不匹配词，直到某个词获得足够支持。模型用随时间收缩的候选集解释，人可以在整词听完前开始识别。"
aliases: ["Cohort model of spoken-word recognition"]
keywords: ["语音词识别的候选集模型", "Cohort model of spoken-word recognition", "口语理解", "词汇竞争", "增量识别", "声音序列", "候选集", "唯一点", "cohort", "spoken word"]
questions: ["为什么会出现语音词识别的候选集模型，它依赖哪些条件？", "语音词识别的候选集模型如何影响词汇竞争，怎样与相关解释区分？"]
sources: [{"book": "cognitive", "chapter": "第9章 · 言语知觉与阅读", "locator": "PDF 第 454–456 页", "pdfPages": [454, 455, 456]}]
candidateRelated: [{"id": "cognition-trace", "reason": "都解释语音随时间展开时的词汇竞争"}, {"id": "cognition-phonemic-restoration", "reason": "语境与受损输入检验候选选择的灵活性"}]
---

## 核心解释

词语的起始声音先激活一组可能候选，随后到来的声音逐渐排除不匹配词，直到某个词获得足够支持。模型用随时间收缩的候选集解释，人可以在整词听完前开始识别。

## 一个例子

理解用例：只听到一个长词的开头时会想到多个可能词，声音继续展开后候选减少，最终留下与当前语音最匹配的词。

## 理解边界

起首声音若被严格当作必要条件，就难以解释噪声下的识别。后续版本调整了候选竞争和语境的作用，不能把最初模型的假设当成全部现状。
