import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ChevronUp, ChevronDown, ChevronRight, ChevronLeft, X, Users, Tag, FolderKanban, ListChecks, BarChart3, Sun, Moon, Calendar, Plus, Minus, TrendingUp, RefreshCw, LogOut, Lock } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import storage from "./lib/storage";
import { AuthProvider, useAuth } from "./lib/auth-context";

const EPICS_SEED_INITIAL = [{"key": "SELLER-256", "project": "STL Seller", "type": "Epic", "summary": "Vincular calculadora com Produtos", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": null, "created": "07/08/2026 15:06:01", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-255", "project": "STL Seller", "type": "Epic", "summary": "[Shopee] Gerador de anúncios", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": null, "created": "07/08/2026 14:29:05", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-250", "project": "STL Seller", "type": "Epic", "summary": "Cancelamento do Oferta/Seller", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "05/08/2026 08:53:47", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-249", "project": "STL Seller", "type": "Epic", "summary": "Calculadora na Flix", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": null, "created": "04/08/2026 14:02:28", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": "Testar uma prévia da calculadora de preços do STLSeller direto na página do modelo na STLFLIX, usando o cálculo como gatilho de ativação cross-produto no momento da descoberta."}, {"key": "SELLER-248", "project": "STL Seller", "type": "Epic", "summary": "Calculadora na IA", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": null, "created": "04/08/2026 14:02:42", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-200", "project": "STL Seller", "type": "Epic", "summary": "[v2] Produtos", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Melhoria", "parent": null, "created": "29/07/2026 20:19:26", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-199", "project": "STL Seller", "type": "Epic", "summary": "[v2] Pedidos", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Melhoria", "parent": null, "created": "29/07/2026 20:18:17", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-194", "project": "STL Seller", "type": "Epic", "summary": "Publicar anúncio no Mercado Livre", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": null, "created": "28/07/2026 11:34:58", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-189", "project": "STL Seller", "type": "Epic", "summary": "Dados (Amplitude e Clarity)", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": null, "created": "28/07/2026 09:42:01", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-188", "project": "STL Seller", "type": "Epic", "summary": "Integração Amazon", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": null, "created": "28/07/2026 09:41:49", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-158", "project": "STL Seller", "type": "Epic", "summary": "Cálculos para modelos em resina", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": null, "created": "16/07/2026 15:56:01", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": "Avaliar uma calculadora de resina indicada pelo time de pesquisa, com estrutura de custo diferente da calculadora atual."}, {"key": "SELLER-155", "project": "STL Seller", "type": "Epic", "summary": "[v2] Calculadora", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em DEV", "stage": "Em dev", "tipo": "Inovação", "parent": null, "created": "16/07/2026 15:50:08", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": "Evoluir a calculadora de preços para guardar impressoras/filamentos/custos reutilizáveis, suportar Pix e ajudar o maker a decidir se vale anunciar — reduzindo o retrabalho de recomeçar cada cálculo do zero."}, {"key": "SELLER-154", "project": "STL Seller", "type": "Epic", "summary": "[v2] Finder", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Produto", "stage": null, "tipo": "Inovação", "parent": null, "created": "16/07/2026 15:49:13", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-153", "project": "STL Seller", "type": "Epic", "summary": "[v2] Gerador de anúncios", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em refinamento Técnico", "stage": "Análise técnica", "tipo": "Inovação", "parent": null, "created": "16/07/2026 15:47:22", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-152", "project": "STL Seller", "type": "Epic", "summary": "[Shopee] Postagem de anúncio", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": null, "created": "16/07/2026 15:45:12", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": "Criar prompts de IA para gerar automaticamente títulos e descrições de anúncios da Shopee, seguindo as boas práticas de SEO e os limites de caracteres da plataforma."}, {"key": "SELLER-88", "project": "STL Seller", "type": "Epic", "summary": "Global", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "28/06/2026 21:59:13", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-48", "project": "STL Seller", "type": "Epic", "summary": "Seller", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "27/05/2026 14:15:10", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-46", "project": "STL Seller", "type": "Epic", "summary": "Cobrança de créditos STLSeller", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em DEV", "stage": "Em dev", "tipo": "Inovação", "parent": null, "created": "20/05/2026 14:57:03", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-42", "project": "STL Seller", "type": "Epic", "summary": "[Seller] Calculadora", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "20/05/2026 10:27:14", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-29", "project": "STL Seller", "type": "Epic", "summary": "Finder", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "11/05/2026 13:07:07", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-14", "project": "STL Seller", "type": "Epic", "summary": "[Seller] Pedidos", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "07/05/2026 17:29:12", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "SELLER-11", "project": "STL Seller", "type": "Epic", "summary": "Produtos", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "04/05/2026 11:32:10", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": "Instrumentar a tela de Estoque no Amplitude (acessos, filtros, alertas de ruptura, exportação, detalhe de produto) para medir engajamento e embasar decisões de evolução."}, {"key": "SELLER-10", "project": "STL Seller", "type": "Epic", "summary": "Avaliador de anúncios", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": null, "created": "21/04/2026 10:28:28", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": "Criar um avaliador de anúncios do Mercado Livre que analisa qualidade e performance de um anúncio e recomenda melhorias, começando pelo orgânico e podendo evoluir para Product Ads."}, {"key": "SELLER-8", "project": "STL Seller", "type": "Epic", "summary": "[IA] My Ads: Geração de Anúncios com IA", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "16/04/2026 11:22:45", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "LOJA-60", "project": "STL Loja", "type": "Epic", "summary": "Atualização Loja", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Melhoria", "parent": null, "created": "04/08/2026 14:08:43", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "LOJA-34", "project": "STL Loja", "type": "Epic", "summary": "Automatizar sincronização de planos entre WooCommerce e Backend (STLFLIX/STLAI)", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em refinamento Técnico", "stage": "Análise técnica", "tipo": "Melhoria", "parent": null, "created": "25/06/2026 14:27:27", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": "Automatizar o cadastro de planos no Backend (STLFLIX/STLAI) direto pelo WooCommerce via API, eliminando o cadastro manual duplicado que hoje deixa clientes sem acesso quando é esquecido."}, {"key": "LOJA-6", "project": "STL Loja", "type": "Epic", "summary": "Reestruturação da Loja STLFLIX", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "17/03/2026 11:17:35", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "IA-264", "project": "STL IA", "type": "Epic", "summary": "[IA] Barra de pesquisa", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em DEV", "stage": "Em dev", "tipo": "Inovação", "parent": null, "created": "05/08/2026 15:36:28", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "IA-156", "project": "STL IA", "type": "Epic", "summary": "Padronização e tradução de campos e modais de filtros para 2D dos customizadores STLAI", "assignee": null, "reporter": "silvana souza", "developer": null, "tester": null, "status": "Em DEV", "stage": "Em dev", "tipo": "Melhoria", "parent": null, "created": "25/05/2026 14:49:30", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "High", "resumo": "Padronizar o layout dos modais de filtros entre os customizadores da STLAI e garantir que todos os textos respeitem o idioma selecionado pelo usuário."}, {"key": "IA-144", "project": "STL IA", "type": "Epic", "summary": "Workbench STLAI: criação de modelos 3D por imagem e edição integrada com Tools", "assignee": "silvana souza", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Em design", "stage": "Em design", "tipo": "Inovação", "parent": null, "created": "19/05/2026 16:10:21", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "High", "resumo": "Evoluir a seção Tools da STLAI para uma Workbench, começando por gerar modelos 3D a partir de fotos/texto (Image to 3D V1) e permitir editar o resultado nas ferramentas existentes."}, {"key": "IA-129", "project": "STL IA", "type": "Epic", "summary": "Multi-Color: Filtro modelos coloridos", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em DEV", "stage": "Em dev", "tipo": "Inovação", "parent": null, "created": "21/04/2026 10:57:35", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "IA-112", "project": "STL IA", "type": "Epic", "summary": "Padronização da experiência e arquitetura dos customizadores (STLAI)", "assignee": "silvana souza", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Produto", "stage": null, "tipo": "Inovação", "parent": null, "created": "22/04/2026 11:26:54", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": "Padronizar a experiência e a arquitetura dos customizadores da STLAI para resolver inconsistência de UX, retrabalho de desenvolvimento e dependência de devs específicos entre os lançamentos."}, {"key": "IA-89", "project": "STL IA", "type": "Epic", "summary": "Análise de comportamento dos usuários nos customizadores", "assignee": "silvana souza", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Produto", "stage": null, "tipo": "Sustentação", "parent": null, "created": "17/04/2026 17:51:19", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "High", "resumo": "Instrumentar o funil de uso dos customizadores da STLAI (2D→3D, erros, satisfação) para entender onde os usuários desistem e o que diferencia quem ativa de quem cancela."}, {"key": "IA-70", "project": "STL IA", "type": "Epic", "summary": "Multi-Color: Exportação colorida para Bambu e Orca", "assignee": "silvana souza", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "14/04/2026 15:20:34", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Highest", "resumo": "Permitir gerar e exportar modelos 3D já coloridos da STLAI prontos para Bambu Studio e Orca, sem precisar de pós-processamento manual em ferramentas externas."}, {"key": "IA-21", "project": "STL IA", "type": "Epic", "summary": "Gerar modelo com qualidade realista superior", "assignee": "silvana souza", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "12/03/2026 15:19:59", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "FLIX-352", "project": "STLFLIX", "type": "Epic", "summary": "Projeto Evolt", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": null, "created": "05/08/2026 12:00:23", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": "Ideia trazida pelo Lincoln para Portugal: cupom gratuito seguido de uma VSL logo na entrada para converter o usuário em outra assinatura."}, {"key": "FLIX-305", "project": "STLFLIX", "type": "Epic", "summary": "[Flix] Ecossistema", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Produto", "stage": null, "tipo": "Inovação", "parent": null, "created": "27/07/2026 09:20:01", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "FLIX-283", "project": "STLFLIX", "type": "Epic", "summary": "Flix em Espanhol", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em rollout", "stage": "Em rollout", "tipo": "Inovação", "parent": null, "created": "20/07/2026 09:47:20", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": true, "priority": "Medium", "resumo": "Adicionar espanhol (LatAm) como terceiro idioma da plataforma, reaproveitando a infraestrutura de i18n já construída para PT-BR."}, {"key": "FLIX-257", "project": "STLFLIX", "type": "Epic", "summary": "[AR] MercadoPago", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em refinamento Técnico", "stage": "Análise técnica", "tipo": "Melhoria", "parent": null, "created": "13/07/2026 10:59:50", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "FLIX-168", "project": "STLFLIX", "type": "Epic", "summary": "[Explore] Novos Filtros", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "15/06/2026 11:43:03", "dataInicio": null, "dataConcl": "24/07/2026", "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "FLIX-142", "project": "STLFLIX", "type": "Epic", "summary": "Lote especial", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "02/06/2026 10:48:09", "dataInicio": null, "dataConcl": "24/07/2026", "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "FLIX-3", "project": "STLFLIX", "type": "Epic", "summary": "[Flix em PT-BR] 01 - Infraestrutura de Idioma", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "10/03/2026 10:25:38", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": true, "priority": "Medium", "resumo": "Criar a base técnica de multi-idioma da STLFlix, começando por PT-BR, com detecção automática, seletor manual e fallback para inglês."}, {"key": "BACK-52", "project": "Backoffice", "type": "Epic", "summary": "Integração ARCA MP", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": null, "created": "07/08/2026 15:02:07", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "BACK-51", "project": "Backoffice", "type": "Epic", "summary": "Novos Headers", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em DEV", "stage": "Em dev", "tipo": "Inovação", "parent": null, "created": "06/08/2026 10:24:42", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "BACK-50", "project": "Backoffice", "type": "Epic", "summary": "[v2] Onboarding GetDemo", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Melhoria", "parent": null, "created": "06/08/2026 09:41:56", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "BACK-46", "project": "Backoffice", "type": "Epic", "summary": "GetDemo", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em rollout", "stage": "Em rollout", "tipo": "Inovação", "parent": null, "created": "15/06/2026 10:44:41", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "BACK-45", "project": "Backoffice", "type": "Epic", "summary": "Onboarding", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "18/06/2026 10:35:33", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}, {"key": "BACK-35", "project": "Backoffice", "type": "Epic", "summary": "[V1] Backoffice seller", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Produto", "stage": null, "tipo": "Sustentação", "parent": null, "created": "23/07/2026 10:20:34", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": "Dar ao time de suporte uma ferramenta interna com autonomia e rastreabilidade para ações de conta do STLSeller (senha, crédito, assinatura), com log de auditoria e visibilidade das integrações de marketplace."}, {"key": "BACK-2", "project": "Backoffice", "type": "Epic", "summary": "Melhorias no Model Shop", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "16/03/2026 16:01:40", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": "Evoluir o backoffice do Model Shop para reduzir trabalho manual no cadastro/publicação de produtos, começando por suportar arquivos grandes para produtos de resina e cosplay."}, {"key": "ACADEMY-45", "project": "STL Academy", "type": "Epic", "summary": "Ambiente novo (Cursos livres, ao vivo, mentorias)", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": null, "created": "05/08/2026 10:13:53", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": true, "priority": "Medium", "resumo": null}];
const TASKS_SEED_INITIAL = [{"key": "SELLER-254", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Criar acesso ao STLSELLER por 1 ano.", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "07/08/2026 08:44:26", "dataInicio": "07/08/2026", "dataConcl": "07/08/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-253", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Cancelar acesso ao seller", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "06/08/2026 12:42:44", "dataInicio": "06/08/2026", "dataConcl": "06/08/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-252", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Pedido de alteração do nome de utilizador", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "05/08/2026 10:49:30", "dataInicio": "05/08/2026", "dataConcl": "05/08/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-251", "project": "STL Seller", "type": "Story", "summary": "Não descontar os créditos da geração do anuncio", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": null, "parent": "SELLER-46", "created": "05/08/2026 09:48:18", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-247", "project": "STL Seller", "type": "Story", "summary": "Usuário colocar URL do produto de venda do mercado livre", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "SELLER-154", "created": "04/08/2026 14:06:34", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-246", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Cancelar acesso a STLSELLER", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "04/08/2026 13:04:38", "dataInicio": "05/08/2026", "dataConcl": "05/08/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-245", "project": "STL Seller", "type": "Story", "summary": "Novas Ações no Histórico", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Melhoria", "parent": "SELLER-155", "created": "29/07/2026 18:11:15", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-244", "project": "STL Seller", "type": "Story", "summary": "[MELI] Campos de postagem de anúncio", "assignee": "João Crescioni", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-8", "created": "15/06/2026 12:03:31", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-243", "project": "STL Seller", "type": "Story", "summary": "Regra de acúmulo e consumo de créditos de filamento", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": null, "created": "15/07/2026 16:58:08", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-242", "project": "STL Seller", "type": "Story", "summary": "[SELLER] Novo gráfico para a dashboard", "assignee": "João Gonzalez", "reporter": "João Crescioni", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "01/07/2026 14:47:07", "dataInicio": null, "dataConcl": "16/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-241", "project": "STL Seller", "type": "Story", "summary": "Tela de pedidos", "assignee": "João Crescioni", "reporter": "João Gonzalez", "developer": "João Crescioni", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-14", "created": "27/05/2026 09:36:28", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-240", "project": "STL Seller", "type": "Story", "summary": "Alterações calculadora", "assignee": "João Crescioni", "reporter": "João Gonzalez", "developer": "João Crescioni", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-42", "created": "02/06/2026 09:39:01", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-239", "project": "STL Seller", "type": "Story", "summary": "Alteração histórico de anúncios", "assignee": "João Crescioni", "reporter": "João Gonzalez", "developer": "João Crescioni", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-8", "created": "25/05/2026 12:41:24", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-238", "project": "STL Seller", "type": "Story", "summary": "Tela de Produtos", "assignee": "João Crescioni", "reporter": "João Gonzalez", "developer": "João Crescioni", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-11", "created": "27/05/2026 09:43:06", "dataInicio": null, "dataConcl": "30/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-237", "project": "STL Seller", "type": "Story", "summary": "Requisitos e Melhorias | STLSALES/SELLER", "assignee": "João Crescioni", "reporter": "João Crescioni", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-8", "created": "11/05/2026 14:53:34", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-236", "project": "STL Seller", "type": "Story", "summary": "Alterações na tela de login", "assignee": "João Crescioni", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "04/07/2026 13:11:02", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-234", "project": "STL Seller", "type": "Story", "summary": "Criar projeto novo no amplitude", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "25/06/2026 10:45:15", "dataInicio": null, "dataConcl": "16/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-233", "project": "STL Seller", "type": "Story", "summary": "Ajuste no dashboard empty states", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Melhoria", "parent": null, "created": "30/07/2026 16:19:48", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-232", "project": "STL Seller", "type": "Story", "summary": "Briefing — painel de custo e lucro (Gestão de Produtos)", "assignee": "João Crescioni", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-11", "created": "04/07/2026 13:28:58", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-231", "project": "STL Seller", "type": "Story", "summary": "Comprar créditos avulsos ao zerar o saldo no STLSeller", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": null, "status": "Pronta p/ teste", "stage": "Em dev", "tipo": "Melhoria", "parent": "SELLER-46", "created": "29/07/2026 20:37:51", "dataInicio": "05/08/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-227", "project": "STL Seller", "type": "Story", "summary": "UI - Atualização NAVBAR + Dropdown Cursos AO VIVO", "assignee": "João Gonzalez", "reporter": "Michel Angelo", "developer": "Michel Angelo", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "14/07/2026 13:02:20", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "SELLER-226", "project": "STL Seller", "type": "Story", "summary": "Implementar CLARITY STLSELLER", "assignee": "João Gonzalez", "reporter": "Michel Angelo", "developer": null, "tester": null, "status": "Fila da sprint UX", "stage": "Pronta pra dev", "tipo": "Melhoria", "parent": "SELLER-189", "created": "13/07/2026 11:45:51", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-225", "project": "STL Seller", "type": "Story", "summary": "[SELLER] Novo fluxo de geração de anúncio", "assignee": "João Gonzalez", "reporter": "João Crescioni", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "01/07/2026 13:28:36", "dataInicio": null, "dataConcl": "16/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-223", "project": "STL Seller", "type": "Story", "summary": "Postar anúncios mercado livre", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": "João Gonzalez", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-8", "created": "11/05/2026 12:45:44", "dataInicio": "16/07/2026", "dataConcl": "16/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-221", "project": "STL Seller", "type": "Story", "summary": "Priorizar a geração de anúncio", "assignee": "João Crescioni", "reporter": "João Gonzalez", "developer": "João Crescioni", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-8", "created": "21/05/2026 10:36:20", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-220", "project": "STL Seller", "type": "Story", "summary": "Onboarding seller", "assignee": "Michel Angelo", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Handoff", "stage": "Em produto", "tipo": "Inovação", "parent": null, "created": "02/07/2026 13:34:11", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-219", "project": "STL Seller", "type": "Story", "summary": "Buscador de STLs — briefing", "assignee": "João Crescioni", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-29", "created": "04/07/2026 12:57:12", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-218", "project": "STL Seller", "type": "Story", "summary": "[SELLER] Página de de benefícios/tudo que a pessoa recebe no Aniversário", "assignee": "João Crescioni", "reporter": "João Crescioni", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "03/07/2026 14:45:38", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "SELLER-217", "project": "STL Seller", "type": "Story", "summary": "Nova nova calculadora", "assignee": "João Crescioni", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "29/06/2026 09:24:39", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-216", "project": "STL Seller", "type": "Story", "summary": "Nova calculadora", "assignee": "João Crescioni", "reporter": "João Gonzalez", "developer": "João Crescioni", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-42", "created": "25/06/2026 09:32:59", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-215", "project": "STL Seller", "type": "Story", "summary": "Alterações Postagem de anúncios", "assignee": "João Crescioni", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-8", "created": "28/06/2026 15:09:23", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-214", "project": "STL Seller", "type": "Story", "summary": "Histórico calculadora", "assignee": "João Crescioni", "reporter": "João Gonzalez", "developer": "João Crescioni", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-42", "created": "25/06/2026 09:33:08", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-213", "project": "STL Seller", "type": "Story", "summary": "Alterações Gerador de anuncios versão 4.9", "assignee": "João Crescioni", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "02/07/2026 15:11:41", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-212", "project": "STL Seller", "type": "Spike", "summary": "Duplicidade de expiração de planos na oferta STLFLIX 4 Anos", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "03/08/2026 13:29:55", "dataInicio": "04/08/2026", "dataConcl": "06/08/2026", "intercom": true, "epic": false, "priority": "Medium"}, {"key": "SELLER-211", "project": "STL Seller", "type": "Story", "summary": "(SSO) Redirecionamento logado Seller", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Melhoria", "parent": null, "created": "03/08/2026 11:05:03", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-210", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Cancelar acesso ao SELLER", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Aguardado suporte", "stage": "Análise técnica", "tipo": null, "parent": null, "created": "03/08/2026 09:00:48", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-209", "project": "STL Seller", "type": "Task", "summary": "Acesso vitalicio", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "30/07/2026 13:30:53", "dataInicio": "05/08/2026", "dataConcl": "05/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-208", "project": "STL Seller", "type": "Bug", "summary": "[Intercom] ML Está reconhecendo vídeos feito pela IA", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": "Sustentação", "parent": null, "created": "30/07/2026 13:18:02", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "High"}, {"key": "SELLER-207", "project": "STL Seller", "type": "Task", "summary": "Consultas seller", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "SELLER-189", "created": "30/07/2026 10:36:03", "dataInicio": "30/07/2026", "dataConcl": "04/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-206", "project": "STL Seller", "type": "Story", "summary": "Vincular calculadora com produtos da IA", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "SELLER-248", "created": "29/07/2026 21:15:16", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-205", "project": "STL Seller", "type": "Story", "summary": "Vincular Calculadora com produtos da Flix", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "SELLER-249", "created": "29/07/2026 21:15:04", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-204", "project": "STL Seller", "type": "Story", "summary": "Eventos Pedidos", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": null, "parent": "SELLER-189", "created": "29/07/2026 21:14:37", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-203", "project": "STL Seller", "type": "Story", "summary": "Eventos Produtos", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": null, "parent": "SELLER-189", "created": "29/07/2026 21:14:32", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-202", "project": "STL Seller", "type": "Story", "summary": "Eventos Configurações", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": null, "parent": "SELLER-189", "created": "29/07/2026 21:14:26", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-201", "project": "STL Seller", "type": "Story", "summary": "Eventos Criar anúncio", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": null, "parent": "SELLER-189", "created": "29/07/2026 21:14:03", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-198", "project": "STL Seller", "type": "Spike", "summary": "[v2] Estoque", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": null, "created": "29/07/2026 20:17:48", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-197", "project": "STL Seller", "type": "Story", "summary": "Passar o Finder na planilha Shopee", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": null, "status": "Code Review", "stage": "Em dev", "tipo": "Sustentação", "parent": "SELLER-154", "created": "29/07/2026 17:14:49", "dataInicio": "04/08/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-196", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Subscription cancellation - STLESELLER", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "29/07/2026 13:51:50", "dataInicio": "31/07/2026", "dataConcl": "31/07/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-193", "project": "STL Seller", "type": "Story", "summary": "Eventors Calculadora", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-189", "created": "28/07/2026 11:23:17", "dataInicio": "30/07/2026", "dataConcl": "04/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-192", "project": "STL Seller", "type": "Story", "summary": "Eventos Gerador de anúncios", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-189", "created": "28/07/2026 11:21:36", "dataInicio": "04/08/2026", "dataConcl": "05/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-191", "project": "STL Seller", "type": "Story", "summary": "Eventos de acesso Seller (Login, Logout, Account Created)", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-189", "created": "28/07/2026 10:19:35", "dataInicio": "30/07/2026", "dataConcl": "04/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-187", "project": "STL Seller", "type": "Story", "summary": "[Seller] Nova Header STLFlix", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": "Inovação", "parent": "BACK-51", "created": "27/07/2026 09:23:04", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-186", "project": "STL Seller", "type": "Task", "summary": "Passar o finder na planilha do México", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": "Sustentação", "parent": null, "created": "24/07/2026 15:19:02", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-185", "project": "STL Seller", "type": "Task", "summary": "Retirar os produtos de arquivos STL do ETSY", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": "SELLER-154", "created": "24/07/2026 15:18:42", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-184", "project": "STL Seller", "type": "Story", "summary": "Passar os finder na planilha do mexico", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": "Inovação", "parent": "SELLER-154", "created": "24/07/2026 15:18:10", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-183", "project": "STL Seller", "type": "Story", "summary": "Gatilho de cobrança de créditos", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": "Inovação", "parent": "SELLER-46", "created": "24/07/2026 15:07:42", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-182", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Cancelamento STLSELLER", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "24/07/2026 11:32:04", "dataInicio": "27/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-181", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Cancelar no acesso ao SELLER", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "24/07/2026 09:45:32", "dataInicio": "24/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-180", "project": "STL Seller", "type": "Task", "summary": "[Intercom] cancelar acesso ao STL Seller", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "23/07/2026 16:09:07", "dataInicio": "24/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-179", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Cliente realizou a assinatura vitalicia da STLSELLER e IA vitalícia e não recebu cupons de descontos.", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "23/07/2026 15:45:31", "dataInicio": "23/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-178", "project": "STL Seller", "type": "Task", "summary": "[Intercom] cancelar acesso ao STL Seller", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "23/07/2026 15:07:08", "dataInicio": "24/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-177", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Cliente efetuou a compra da STLSELLER vitalício e não foi liberado cupons de descontos", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "23/07/2026 13:27:48", "dataInicio": "23/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-176", "project": "STL Seller", "type": "Bug", "summary": "Produto com descrição diferente da imagem", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "22/07/2026 10:33:12", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "SELLER-175", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Cancelamento assinatura Seller", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "22/07/2026 08:53:04", "dataInicio": "22/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-174", "project": "STL Seller", "type": "Story", "summary": "[Roas] Adicionar calculo de Roas", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": null, "status": "Em DEV", "stage": "Em dev", "tipo": "Inovação", "parent": "SELLER-155", "created": "21/07/2026 15:53:53", "dataInicio": "06/08/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-173", "project": "STL Seller", "type": "Story", "summary": "Seção: Custos extras", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Melhoria", "parent": "SELLER-155", "created": "21/07/2026 15:53:46", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-172", "project": "STL Seller", "type": "Story", "summary": "[Precificação] adicionar calculo de desconto", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Melhoria", "parent": "SELLER-155", "created": "21/07/2026 15:53:39", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-171", "project": "STL Seller", "type": "Story", "summary": "[Impressão] Biblioteca de impressora e filamentos", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Melhoria", "parent": "SELLER-155", "created": "21/07/2026 15:53:29", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-170", "project": "STL Seller", "type": "Story", "summary": "[Modelo] Anexar o arquivo 3MF do produto ao cálculo", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Melhoria", "parent": "SELLER-155", "created": "21/07/2026 15:53:13", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-169", "project": "STL Seller", "type": "Story", "summary": "Atualização plano anual do aniversário", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": null, "created": "21/07/2026 15:50:01", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-168", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Problema na integração STL Seller e Mercado Livre", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "21/07/2026 14:37:51", "dataInicio": "21/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-167", "project": "STL Seller", "type": "Task", "summary": "[Intercom] SELLER", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "21/07/2026 13:40:29", "dataInicio": "29/07/2026", "dataConcl": "29/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "SELLER-166", "project": "STL Seller", "type": "Story", "summary": "[Seller] Criar campo para grava erro na Tabela de \"Criar anúncio\"", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": null, "status": "Em DEV", "stage": "Em dev", "tipo": "Inovação", "parent": "SELLER-194", "created": "20/07/2026 13:56:39", "dataInicio": "29/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-165", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Erro ao publicar anúncio na plataforma Seller - campo sobrenome obrigatório", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "20/07/2026 11:39:34", "dataInicio": "21/07/2026", "dataConcl": "27/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "SELLER-164", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Cupons de desconto da assinatura não aplicados na finalização da compra", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "20/07/2026 09:23:44", "dataInicio": "20/07/2026", "dataConcl": "20/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "SELLER-163", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Cancelamento de assinatura e reembolso por insatisfação com IA", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "20/07/2026 09:12:32", "dataInicio": "22/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-160", "project": "STL Seller", "type": "Story", "summary": "Moeda de exibição", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "João Gonzalez", "status": "Em DEV", "stage": "Em dev", "tipo": "Melhoria", "parent": "SELLER-155", "created": "16/07/2026 15:56:22", "dataInicio": "06/08/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-157", "project": "STL Seller", "type": "Story", "summary": "Seção: Canal de venda - Pix", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": "SELLER-155", "created": "16/07/2026 15:55:42", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-156", "project": "STL Seller", "type": "Story", "summary": "Horário da calculadora +24h", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-155", "created": "16/07/2026 15:55:36", "dataInicio": "22/07/2026", "dataConcl": "24/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-151", "project": "STL Seller", "type": "Task", "summary": "[Intercom] STLSeller credits deducted during trial despite livestream assurance", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "16/07/2026 13:39:14", "dataInicio": "16/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-150", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Erro ao publicar produto no Mercado Livre via STL Seller com campo family_name faltando", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "16/07/2026 10:20:21", "dataInicio": "16/07/2026", "dataConcl": "16/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "SELLER-149", "project": "STL Seller", "type": "Story", "summary": "[Intercom] Lista limitada de impressoras", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": "SELLER-155", "created": "15/07/2026 19:00:54", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "High"}, {"key": "SELLER-148", "project": "STL Seller", "type": "Story", "summary": "[Intercom] Multiple issues reported on new seller system including language mix and missing features", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": "Inovação", "parent": null, "created": "15/07/2026 17:37:55", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "High"}, {"key": "SELLER-147", "project": "STL Seller", "type": "Task", "summary": "Lógica de Cupons de Filamento - SELLER", "assignee": "Andre Bisewski", "reporter": "Caroline Araújo da Silva", "developer": "Caroline Araújo da Silva", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "15/07/2026 09:55:31", "dataInicio": "15/07/2026", "dataConcl": "27/07/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "SELLER-146", "project": "STL Seller", "type": "Task", "summary": "[Seller] Erro ao resetar senha", "assignee": "Andre Bisewski", "reporter": "Caroline Araújo da Silva", "developer": "Caroline Araújo da Silva", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "14/07/2026 15:46:13", "dataInicio": "14/07/2026", "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-145", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Erro ao resetar senha na plataforma STL Seller", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "14/07/2026 14:15:07", "dataInicio": "15/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "High"}, {"key": "SELLER-144", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Solicitação de estorno da assinatura do plano aniversário", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "14/07/2026 13:18:07", "dataInicio": "20/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-143", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Erro no link para redefinição de senha e acesso ao seller.stlflix", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "14/07/2026 10:37:34", "dataInicio": "15/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "High"}, {"key": "SELLER-142", "project": "STL Seller", "type": "Task", "summary": "SSO no Seller", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": "SELLER-48", "created": "14/07/2026 09:44:18", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-141", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Solicitação de alteração de conta Mercado Livre para CNPJ no pacote de aniversário STLFlix", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "13/07/2026 14:52:27", "dataInicio": "14/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-140", "project": "STL Seller", "type": "Story", "summary": "Atualizações de segurança", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "13/07/2026 14:50:50", "dataInicio": "13/07/2026", "dataConcl": "27/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-139", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Solicitação de cancelamento de assinatura do pacote de aniversário", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "13/07/2026 11:43:13", "dataInicio": "15/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-138", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Cancellation Request for Order HP0550511388", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "13/07/2026 11:02:37", "dataInicio": "15/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-137", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Solicitação de cancelamento e reembolso por insatisfação com conteúdo", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "13/07/2026 10:19:12", "dataInicio": "15/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-136", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Erro ao conectar conta Shopee e sugestão para STL Seller", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 15:28:40", "dataInicio": "10/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "High"}, {"key": "SELLER-135", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Erro ao conectar loja Shopee no seller", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 15:14:51", "dataInicio": "10/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "High"}, {"key": "SELLER-134", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Unable to Access STLSeller and No Password Reset Email Received", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 14:34:40", "dataInicio": "13/07/2026", "dataConcl": "13/07/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-133", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Request for STL Seller cancellation and refund due to language and functionality issues", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 14:33:16", "dataInicio": "15/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-132", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Solicitação de cancelamento e reembolso da compra da Campanha de Aniversário", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 13:49:42", "dataInicio": "15/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-131", "project": "STL Seller", "type": "Bug", "summary": "[Intercom] Erro Ao publicar anuncio", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "SELLER-194", "created": "10/07/2026 13:01:46", "dataInicio": "14/07/2026", "dataConcl": "29/07/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-130", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Dúvida sobre cupons de filamento e acesso ao curso em português no plano global", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 11:11:57", "dataInicio": "10/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-129", "project": "STL Seller", "type": "Task", "summary": "[Idioma] Ajuste de tradução Idioma EN", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 10:48:50", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-128", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Solicitação de cancelamento de plano por cliente Eliana", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 10:09:23", "dataInicio": "10/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-127", "project": "STL Seller", "type": "Task", "summary": "[Intercom] Dúvida sobre acúmulo e validade dos cupons do plano vitalício", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "09/07/2026 14:30:33", "dataInicio": "09/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "SELLER-126", "project": "STL Seller", "type": "Bug", "summary": "Retenção de turma para alunos existentes que compram o plano de aniversário de 4 anos", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "SELLER-48", "created": "09/07/2026 11:28:11", "dataInicio": "09/07/2026", "dataConcl": "16/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-125", "project": "STL Seller", "type": "Story", "summary": "Liberar e-mails em massa", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "09/07/2026 11:25:30", "dataInicio": "13/07/2026", "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-124", "project": "STL Seller", "type": "Story", "summary": "Botão de feedback no header do STLSeller", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "09/07/2026 11:07:30", "dataInicio": "09/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-123", "project": "STL Seller", "type": "Story", "summary": "Finder - prioridade makeword", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-29", "created": "08/07/2026 17:46:49", "dataInicio": "10/07/2026", "dataConcl": "16/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-122", "project": "STL Seller", "type": "Story", "summary": "Adicionar tag de beta ao lado da logo", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "08/07/2026 17:41:59", "dataInicio": "08/07/2026", "dataConcl": "09/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-121", "project": "STL Seller", "type": "Story", "summary": "Calculadora em Dolar", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-42", "created": "08/07/2026 17:38:44", "dataInicio": "08/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-120", "project": "STL Seller", "type": "Story", "summary": "Alterações calculadora - Frete Grátis", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-42", "created": "08/07/2026 15:35:55", "dataInicio": "08/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-116", "project": "STL Seller", "type": "Story", "summary": "Calculadora", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-42", "created": "07/07/2026 21:10:23", "dataInicio": "08/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-115", "project": "STL Seller", "type": "Story", "summary": "Buscador de STL", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "07/07/2026 13:28:27", "dataInicio": "08/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-114", "project": "STL Seller", "type": "Story", "summary": "Ajustes calculadora 2", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-42", "created": "07/07/2026 10:16:19", "dataInicio": "07/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-113", "project": "STL Seller", "type": "Task", "summary": "Validação da Jornada de Compra Ponta a Ponta — Todos os Planos Aniversário", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "SELLER-48", "created": "06/07/2026 17:03:36", "dataInicio": "07/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-112", "project": "STL Seller", "type": "Story", "summary": "Ajustes Finder", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "06/07/2026 10:31:09", "dataInicio": "06/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-111", "project": "STL Seller", "type": "Story", "summary": "[Seller] Tela de Login", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "06/07/2026 13:27:26", "dataInicio": "07/07/2026", "dataConcl": "09/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-110", "project": "STL Seller", "type": "Task", "summary": "Retirar Produtos finder", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "06/07/2026 10:29:35", "dataInicio": "06/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-109", "project": "STL Seller", "type": "Story", "summary": "Alterações calculadora", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "04/07/2026 22:19:46", "dataInicio": "05/07/2026", "dataConcl": "09/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-106", "project": "STL Seller", "type": "Story", "summary": "Investigação da divergência de taxas retornadas pela API do Mercado Livre", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "03/07/2026 16:35:07", "dataInicio": "03/07/2026", "dataConcl": "06/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-105", "project": "STL Seller", "type": "Story", "summary": "Tela de Acesso (Deslogado) do STLSeller", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "04/07/2026 13:00:47", "dataInicio": "07/07/2026", "dataConcl": "09/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-104", "project": "STL Seller", "type": "Story", "summary": "Embed - Assinantes anual - Plataforma Global", "assignee": "Andre Bisewski", "reporter": "Ray Lima", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "01/07/2026 15:55:42", "dataInicio": "06/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "SELLER-103", "project": "STL Seller", "type": "Story", "summary": "Embed - Assinantes anual - Plataforma BR", "assignee": "Andre Bisewski", "reporter": "Ray Lima", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "01/07/2026 14:45:47", "dataInicio": "06/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "SELLER-102", "project": "STL Seller", "type": "Story", "summary": "[SELLER] Página de de benefícios/tudo que a pessoa recebe no Aniversário 4 anos", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "04/07/2026 12:16:37", "dataInicio": "07/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "SELLER-99", "project": "STL Seller", "type": "Story", "summary": "UX alterações Pedidos", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-14", "created": "02/07/2026 16:38:31", "dataInicio": "09/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-97", "project": "STL Seller", "type": "Story", "summary": "UX detalhes - Produtos", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-11", "created": "02/07/2026 15:26:10", "dataInicio": "08/07/2026", "dataConcl": "09/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-96", "project": "STL Seller", "type": "Story", "summary": "Detalhes de UX - Dashboard", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "02/07/2026 13:34:55", "dataInicio": "07/07/2026", "dataConcl": "29/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-95", "project": "STL Seller", "type": "Story", "summary": "Vincular calculadora com Produtos", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": "SELLER-155", "created": "30/06/2026 16:49:16", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-94", "project": "STL Seller", "type": "Story", "summary": "Data da criação de anuncio", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-29", "created": "30/06/2026 16:45:50", "dataInicio": "06/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-92", "project": "STL Seller", "type": "Story", "summary": "[Eventos] Home empty states", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "28/06/2026 22:04:28", "dataInicio": "09/07/2026", "dataConcl": "16/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-89", "project": "STL Seller", "type": "Story", "summary": "Seller na versão global", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-88", "created": "28/06/2026 21:59:31", "dataInicio": "07/07/2026", "dataConcl": "16/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-84", "project": "STL Seller", "type": "Story", "summary": "Postagem de anuncio na shopee", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": "Inovação", "parent": "SELLER-152", "created": "28/06/2026 21:41:09", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-83", "project": "STL Seller", "type": "Story", "summary": "[Finder] Aplicação layout e categorias", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "28/06/2026 21:40:28", "dataInicio": "02/07/2026", "dataConcl": "06/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-82", "project": "STL Seller", "type": "Story", "summary": "Histórico da calculadora BR", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-42", "created": "28/06/2026 21:27:56", "dataInicio": "02/07/2026", "dataConcl": "06/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-81", "project": "STL Seller", "type": "Story", "summary": "Nova Calculadora modelo BR", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-42", "created": "28/06/2026 21:21:23", "dataInicio": "02/07/2026", "dataConcl": "06/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-80", "project": "STL Seller", "type": "Story", "summary": "Integração com Shopee não está trazendo informações de Pedidos e estoque", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "João Gonzalez", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "28/06/2026 16:06:06", "dataInicio": "01/07/2026", "dataConcl": "06/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-79", "project": "STL Seller", "type": "Story", "summary": "Passar o finder na planilha da argentina", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": "SELLER-29", "created": "28/06/2026 15:57:19", "dataInicio": "30/06/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-78", "project": "STL Seller", "type": "Story", "summary": "Publicar anúncio no Mercado Livre (PAUSADA)", "assignee": null, "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": null, "status": "Em DEV", "stage": "Em dev", "tipo": "Inovação", "parent": "SELLER-194", "created": "28/06/2026 14:33:33", "dataInicio": "01/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-77", "project": "STL Seller", "type": "Story", "summary": "Subdomínio e Configuração de Ambiente do STLSeller", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "28/06/2026 08:25:48", "dataInicio": "30/06/2026", "dataConcl": "02/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-76", "project": "STL Seller", "type": "Story", "summary": "[GetDemo] Identificação de usuário novo e envio para GetDemo no STLSeller", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "BACK-46", "created": "22/06/2026 14:40:19", "dataInicio": "26/06/2026", "dataConcl": "02/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-75", "project": "STL Seller", "type": "Story", "summary": "[Seller] Integração das IAs de Geração de Conteúdo", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-8", "created": "22/06/2026 10:32:35", "dataInicio": "06/07/2026", "dataConcl": "09/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-70", "project": "STL Seller", "type": "Story", "summary": "[Pedidos] Sincronizar pedidos", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": "SELLER-199", "created": "15/06/2026 09:44:55", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-69", "project": "STL Seller", "type": "Story", "summary": "[Produtos] Exportar CSV", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": "SELLER-200", "created": "15/06/2026 09:43:55", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-68", "project": "STL Seller", "type": "Story", "summary": "[Pedidos] Exportar CSV", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": "SELLER-199", "created": "15/06/2026 09:42:42", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-67", "project": "STL Seller", "type": "Story", "summary": "[Estoque] Filtros avançados", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": "SELLER-200", "created": "15/06/2026 09:41:53", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-66", "project": "STL Seller", "type": "Story", "summary": "[Pedidos] Filtros avançados", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": "SELLER-199", "created": "15/06/2026 09:41:16", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-61", "project": "STL Seller", "type": "Story", "summary": "[Produtos] Sincronizar estoque", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": "SELLER-200", "created": "15/06/2026 09:46:51", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-60", "project": "STL Seller", "type": "Story", "summary": "[Produtos] Ajuste de estoque pela linha do produto", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": "SELLER-200", "created": "15/06/2026 09:46:13", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-59", "project": "STL Seller", "type": "Story", "summary": "[Produtos] Indicadores de alerta de saúde do estoque", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": "SELLER-200", "created": "15/06/2026 09:45:36", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-58", "project": "STL Seller", "type": "Story", "summary": "[Seller] Produtos: Aplicação do Layout", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-11", "created": "13/06/2026 06:18:00", "dataInicio": "15/06/2026", "dataConcl": "04/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-57", "project": "STL Seller", "type": "Story", "summary": "[Seller] Pedidos: Aplicação de layout", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-14", "created": "12/06/2026 17:29:18", "dataInicio": "19/06/2026", "dataConcl": "09/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-56", "project": "STL Seller", "type": "Story", "summary": "[Seller] Dashboard consolidado com contas de marketplace conectadas", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "12/06/2026 17:16:55", "dataInicio": "24/06/2026", "dataConcl": "09/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-51", "project": "STL Seller", "type": "Story", "summary": "[Seller] Intercom - suporte", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "27/05/2026 14:15:49", "dataInicio": "05/07/2026", "dataConcl": "06/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-50", "project": "STL Seller", "type": "Story", "summary": "GetDemo", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "27/05/2026 14:15:33", "dataInicio": "02/06/2026", "dataConcl": "12/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-49", "project": "STL Seller", "type": "Story", "summary": "[Dashboard]  Eventos", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": "SELLER-48", "created": "27/05/2026 14:15:28", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-47", "project": "STL Seller", "type": "Story", "summary": "Menu de pedidos", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "João Gonzalez", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-14", "created": "27/05/2026 09:31:44", "dataInicio": "01/06/2026", "dataConcl": "06/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-45", "project": "STL Seller", "type": "Story", "summary": "Geração de vídeo UGC", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": "SELLER-153", "created": "25/05/2026 12:35:07", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-44", "project": "STL Seller", "type": "Story", "summary": "Criação de eventos no Amplitude - Calculadora de Preços", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-42", "created": "20/05/2026 15:00:50", "dataInicio": "05/07/2026", "dataConcl": "06/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-43", "project": "STL Seller", "type": "Story", "summary": "Calculadora de preços", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-42", "created": "20/05/2026 14:58:49", "dataInicio": "26/05/2026", "dataConcl": "01/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-41", "project": "STL Seller", "type": "Story", "summary": "Investigar coleta de visitas por anúncio", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": "SELLER-10", "created": "21/04/2026 10:32:24", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-40", "project": "STL Seller", "type": "Story", "summary": "Investigar Product Ads para fase futura", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": "SELLER-10", "created": "21/04/2026 10:32:56", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-39", "project": "STL Seller", "type": "Story", "summary": "Investigar sinais de qualidade da publicação", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": "SELLER-10", "created": "21/04/2026 10:32:37", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-38", "project": "STL Seller", "type": "Story", "summary": "Investigar coleta de pedidos/vendas", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": "SELLER-10", "created": "21/04/2026 10:32:31", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-37", "project": "STL Seller", "type": "Story", "summary": "Construir MVP do avaliador", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": "SELLER-10", "created": "21/04/2026 10:32:50", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-36", "project": "STL Seller", "type": "Story", "summary": "Definir score inicial do avaliador", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": "SELLER-10", "created": "21/04/2026 10:32:44", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-34", "project": "STL Seller", "type": "Story", "summary": "[Finder] Atualização de UX", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-29", "created": "11/05/2026 16:59:44", "dataInicio": "02/07/2026", "dataConcl": "06/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-33", "project": "STL Seller", "type": "Story", "summary": "[Finder] Integração Etsy", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-29", "created": "11/05/2026 16:47:44", "dataInicio": "18/06/2026", "dataConcl": "02/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-32", "project": "STL Seller", "type": "Story", "summary": "[Finder] Integração Amazon", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": "SELLER-154", "created": "11/05/2026 16:46:21", "dataInicio": "03/06/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-31", "project": "STL Seller", "type": "Story", "summary": "[Finder] Integração Mercado Livre", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "João Gonzalez", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-29", "created": "11/05/2026 16:17:56", "dataInicio": "12/05/2026", "dataConcl": "02/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-30", "project": "STL Seller", "type": "Story", "summary": "[Finder] Integração Shopee", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-29", "created": "11/05/2026 16:17:06", "dataInicio": "13/07/2026", "dataConcl": "24/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-26", "project": "STL Seller", "type": "Story", "summary": "[Finder] Integração Cuts 3D", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "João Gonzalez", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-29", "created": "11/05/2026 13:03:24", "dataInicio": "11/05/2026", "dataConcl": "02/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-25", "project": "STL Seller", "type": "Story", "summary": "[Finder] Integração Makeword", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "João Gonzalez", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-29", "created": "11/05/2026 13:03:24", "dataInicio": "21/05/2026", "dataConcl": "06/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-22", "project": "STL Seller", "type": "Story", "summary": "Modelo de negócios", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": "João Gonzalez", "tester": "João Gonzalez", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-46", "created": "11/05/2026 12:56:15", "dataInicio": "09/07/2026", "dataConcl": "09/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-20", "project": "STL Seller", "type": "Story", "summary": "Publicação de anuncio no mercado livre - após geração do anuncio", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "João Gonzalez", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-8", "created": "11/05/2026 12:38:17", "dataInicio": "25/05/2026", "dataConcl": "09/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-19", "project": "STL Seller", "type": "Story", "summary": "Fluxo completo: Geração de anúncio", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "João Gonzalez", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-8", "created": "11/05/2026 12:32:44", "dataInicio": "12/05/2026", "dataConcl": "09/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-15", "project": "STL Seller", "type": "Story", "summary": "[Seller] Home orientada à ativação no primeiro acesso", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "08/05/2026 08:53:20", "dataInicio": "19/06/2026", "dataConcl": "22/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-13", "project": "STL Seller", "type": "Story", "summary": "Menu de Produtos", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "João Gonzalez", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-11", "created": "04/05/2026 14:27:41", "dataInicio": "01/06/2026", "dataConcl": "02/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-9", "project": "STL Seller", "type": "Story", "summary": "Investigar autenticação (API) com Mercado Livre", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-14", "created": "21/04/2026 10:32:12", "dataInicio": "21/04/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-7", "project": "STL Seller", "type": "Story", "summary": "Retirar a funcionalidade de \"Comprar domínios\" custom da MyStore", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Inovação", "parent": null, "created": "26/04/2026 13:38:16", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-5", "project": "STL Seller", "type": "Story", "summary": "[MyStore] Novo Onboarding", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "SELLER-4", "project": "STL Seller", "type": "Story", "summary": "[MyStore] Novos pontos de ajuda em video", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "SELLER-3", "project": "STL Seller", "type": "Story", "summary": "[MyStore] Nova UI/Temas Lojas usuário", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Inovação", "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "SELLER-2", "project": "STL Seller", "type": "Story", "summary": "[MyStore]  Suporte aos domínios customizados", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "SELLER-1", "project": "STL Seller", "type": "Story", "summary": "[MyStore]  Atualização UI Dashboard", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "LOJA-64", "project": "STL Loja", "type": "Task", "summary": "[Intercom] Restaurar cupom na conta do cliente", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "05/08/2026 16:12:26", "dataInicio": "05/08/2026", "dataConcl": "05/08/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "LOJA-63", "project": "STL Loja", "type": "Task", "summary": "[Intercom] Créditos de filamentos não voltaram para o cliente após cancelamento da compra", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "05/08/2026 13:50:48", "dataInicio": "05/08/2026", "dataConcl": "05/08/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "LOJA-62", "project": "STL Loja", "type": "Task", "summary": "[Intercom] restaurar cupons de filamento na conta do cliente", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "05/08/2026 13:44:58", "dataInicio": "05/08/2026", "dataConcl": "05/08/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "LOJA-61", "project": "STL Loja", "type": "Task", "summary": "[Intercom] Restaurar cupons de filamento na conta do cliente", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "05/08/2026 11:59:21", "dataInicio": "05/08/2026", "dataConcl": "05/08/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "LOJA-59", "project": "STL Loja", "type": "Story", "summary": "Reforma Loja STLFLIX", "assignee": "Michel Angelo", "reporter": "João Gonzalez", "developer": "Michel Angelo", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "22/04/2026 16:13:56", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-58", "project": "STL Loja", "type": "Task", "summary": "[Intercom] Restaurar cupons de filamento na conta do cliente", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "04/08/2026 12:16:30", "dataInicio": "04/08/2026", "dataConcl": "04/08/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "LOJA-57", "project": "STL Loja", "type": "Task", "summary": "Retirar modal e banner da loja", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "03/08/2026 17:40:46", "dataInicio": "04/08/2026", "dataConcl": "06/08/2026", "intercom": true, "epic": false, "priority": "Medium"}, {"key": "LOJA-56", "project": "STL Loja", "type": "Story", "summary": "[Intercom] Retorno dos créditos de filamento após cancelamento de pedido.", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": "Melhoria", "parent": null, "created": "30/07/2026 14:05:08", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "LOJA-55", "project": "STL Loja", "type": "Story", "summary": "[STLSTORE] Aviso de instabilidade de estoque de filamentos", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "24/07/2026 11:55:07", "dataInicio": "24/07/2026", "dataConcl": "24/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-54", "project": "STL Loja", "type": "Task", "summary": "[Intercom] Saldo/extrato de cupons de filamentos não apresenta o valor total", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "22/07/2026 18:45:16", "dataInicio": "28/07/2026", "dataConcl": "28/07/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "LOJA-52", "project": "STL Loja", "type": "Bug", "summary": "Endereço do Checkout com mais de 60 caracteres", "assignee": "Andre Bisewski", "reporter": "Lucas Melo", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "20/07/2026 16:08:34", "dataInicio": "24/07/2026", "dataConcl": "03/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-50", "project": "STL Loja", "type": "Task", "summary": "[Intercom] Créditos de filamentos sumiram e histórico de pedidos vazio", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "20/07/2026 09:56:39", "dataInicio": "20/07/2026", "dataConcl": "20/07/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "LOJA-49", "project": "STL Loja", "type": "Bug", "summary": "[Intercom] Erro na geração do Pix e login no site STLFlix", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "17/07/2026 17:42:01", "dataInicio": "20/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "Highest"}, {"key": "LOJA-48", "project": "STL Loja", "type": "Task", "summary": "[Intercom] Saldo de cupons zerado após troca de e-mail na compra do plano de aniversário", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "17/07/2026 13:00:19", "dataInicio": "20/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "LOJA-47", "project": "STL Loja", "type": "Bug", "summary": "[Intercom] Erro ao tentar finalizar compra - métodos de pagamento indisponíveis", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "15/07/2026 10:27:58", "dataInicio": "15/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "Highest"}, {"key": "LOJA-46", "project": "STL Loja", "type": "Story", "summary": "Banner nas categorias", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "14/07/2026 14:10:06", "dataInicio": "14/07/2026", "dataConcl": "16/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-45", "project": "STL Loja", "type": "Story", "summary": "Lógica para cupom exclusivo de assinantes do aniversário", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "14/07/2026 13:44:51", "dataInicio": "14/07/2026", "dataConcl": "27/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-44", "project": "STL Loja", "type": "Task", "summary": "[Intercom] Dúvidas sobre promoções e abertura de chamado para cupons de desconto", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "13/07/2026 18:12:39", "dataInicio": "14/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "LOJA-43", "project": "STL Loja", "type": "Task", "summary": "[Intercom] Análise pendente sobre créditos não recebidos e divergência de preços no plano STL Seller", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 18:59:02", "dataInicio": "15/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "LOJA-42", "project": "STL Loja", "type": "Task", "summary": "[Intercom] Inconsistência no saldo total de cupons de filamentos e cota reduzida após compras", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 15:18:22", "dataInicio": "14/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "LOJA-41", "project": "STL Loja", "type": "Bug", "summary": "[Intercom] Cliente sem acesso à STLAI", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "06/07/2026 09:04:56", "dataInicio": "06/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "Highest"}, {"key": "LOJA-40", "project": "STL Loja", "type": "Task", "summary": "[Intercom] White page loading issue on STLFlix platform", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "02/07/2026 15:58:30", "dataInicio": "03/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "Highest"}, {"key": "LOJA-39", "project": "STL Loja", "type": "Story", "summary": "Alterar termos de garantia", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "02/07/2026 12:08:18", "dataInicio": "10/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-38", "project": "STL Loja", "type": "Task", "summary": "[Intercom] Bônus adicionado automaticamente", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "02/07/2026 11:21:18", "dataInicio": "02/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "Highest"}, {"key": "LOJA-37", "project": "STL Loja", "type": "Bug", "summary": "[Intercom] Erro ao finalizar compra e login na plataforma STLAI", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "30/06/2026 15:12:27", "dataInicio": "01/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "Highest"}, {"key": "LOJA-36", "project": "STL Loja", "type": "Bug", "summary": "[Intercom] No Payment Methods Available for Filament Purchase on STLFLIX", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "30/06/2026 15:09:00", "dataInicio": "01/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "Highest"}, {"key": "LOJA-35", "project": "STL Loja", "type": "Task", "summary": "[Intercom] Solicitação de reativação de crédito de filamento utilizado em pedido cancelado.", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "29/06/2026 17:23:10", "dataInicio": "30/06/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "Highest"}, {"key": "LOJA-33", "project": "STL Loja", "type": "Task", "summary": "Dificuldade de acesso ao STLAI mesmo com assinatura ativa", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "23/06/2026 13:43:57", "dataInicio": "24/06/2026", "dataConcl": "24/06/2026", "intercom": true, "epic": false, "priority": "Highest"}, {"key": "LOJA-32", "project": "STL Loja", "type": "Task", "summary": "Problema de acesso ao STLAI após assinatura do plano combinado", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "23/06/2026 13:16:44", "dataInicio": "24/06/2026", "dataConcl": "24/06/2026", "intercom": true, "epic": false, "priority": "Highest"}, {"key": "LOJA-31", "project": "STL Loja", "type": "Bug", "summary": "Pagamento via boleto não atualizado e erro em valor recorrente do curso", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "23/06/2026 11:47:46", "dataInicio": "25/06/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "Highest"}, {"key": "LOJA-30", "project": "STL Loja", "type": "Task", "summary": "Alterações na loja", "assignee": "Andre Bisewski", "reporter": "Ray Lima", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "LOJA-6", "created": "22/06/2026 09:55:43", "dataInicio": "30/06/2026", "dataConcl": "02/07/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "LOJA-29", "project": "STL Loja", "type": "Bug", "summary": "Erro ao tentar adquirir plano Lifetime na loja STLFlix", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "19/06/2026 09:46:58", "dataInicio": "25/06/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "Highest"}, {"key": "LOJA-23", "project": "STL Loja", "type": "Incidentes", "summary": "Loja BR Fora do ar", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/06/2026 12:03:10", "dataInicio": "10/06/2026", "dataConcl": "10/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-22", "project": "STL Loja", "type": "Task", "summary": "[LOJA] Mensagem de Senha Incorreta não é exibida", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "03/06/2026 10:20:01", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-20", "project": "STL Loja", "type": "Task", "summary": "Documentação de Checkout (Interno)", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "05/05/2026 09:57:54", "dataInicio": "05/05/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-19", "project": "STL Loja", "type": "Task", "summary": "Compra por CNPJ não é finalizada devido a exigência do campo \"Empresa\"", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "23/04/2026 16:09:39", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-18", "project": "STL Loja", "type": "Task", "summary": "Entrega não encontrada para Cep do Paraná", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "23/04/2026 10:05:43", "dataInicio": "24/04/2026", "dataConcl": "12/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-17", "project": "STL Loja", "type": "Story", "summary": "Retirar o botão de \"Cancelar\" da Loja", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "15/04/2026 11:44:44", "dataInicio": "23/04/2026", "dataConcl": "05/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-16", "project": "STL Loja", "type": "Task", "summary": "[Solicitações] Clone – [Integração ASAAS] Instabilidade no Checkout -", "assignee": "Andre Bisewski", "reporter": "Caroline Araújo da Silva", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "09/04/2026 16:59:08", "dataInicio": "09/04/2026", "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "LOJA-15", "project": "STL Loja", "type": "Incidentes", "summary": "[Solicitações] Clone – Erro ao finalizar compra da impressora Bambulab A1 Combo AMS", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "09/04/2026 11:32:06", "dataInicio": "09/04/2026", "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-14", "project": "STL Loja", "type": "Incidentes", "summary": "[Solicitações] Clone – Pagamento pendente após PIX realizado", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "08/04/2026 17:35:52", "dataInicio": "09/04/2026", "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-13", "project": "STL Loja", "type": "Incidentes", "summary": "[Solicitações] Clone – Pagamento em 10 vezes via boleto não autorizado no site", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "08/04/2026 15:18:48", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-11", "project": "STL Loja", "type": "Story", "summary": "Parametro de URL para compras", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "06/04/2026 11:30:28", "dataInicio": "09/04/2026", "dataConcl": "05/05/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "LOJA-10", "project": "STL Loja", "type": "Bug", "summary": "[STORE] Erro no Checkout com CEP sem Bairro", "assignee": "Andre Bisewski", "reporter": "Caroline Araújo da Silva", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "31/03/2026 14:08:54", "dataInicio": "08/04/2026", "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "LOJA-8", "project": "STL Loja", "type": "Story", "summary": "Atualizar dados de contato no rodapé do Ecommerce", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "30/03/2026 09:56:12", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-7", "project": "STL Loja", "type": "Story", "summary": "[LOJA] Informações de Pedidos", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "LOJA-6", "created": "17/03/2026 11:18:07", "dataInicio": "16/04/2026", "dataConcl": "05/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-5", "project": "STL Loja", "type": "Story", "summary": "Página de venda Impressora - Snapmaker U1", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": null, "created": "16/03/2026 11:50:28", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-3", "project": "STL Loja", "type": "Bug", "summary": "[STORE - BR] Inconsistência no checkout ao alterar Estado após informar CEP (sem recálculo de endereço)", "assignee": null, "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "12/03/2026 14:25:07", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "LOJA-2", "project": "STL Loja", "type": "Bug", "summary": "[STORE] Login nos Checkout de Pagamento", "assignee": "Andre Bisewski", "reporter": "Caroline Araújo da Silva", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "12/03/2026 14:22:04", "dataInicio": "15/04/2026", "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-269", "project": "STL IA", "type": "Story", "summary": "Remover Creators do headers da STLAI", "assignee": "silvana souza", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Melhoria", "parent": "BACK-51", "created": "06/08/2026 11:53:59", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-265", "project": "STL IA", "type": "Story", "summary": "Remover Cupons da plataforma", "assignee": "silvana souza", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Melhoria", "parent": "BACK-51", "created": "06/08/2026 10:30:30", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-263", "project": "STL IA", "type": "Story", "summary": "Adicionar filtro realista para o mini-flexi", "assignee": "silvana souza", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Melhoria", "parent": null, "created": "05/08/2026 14:39:31", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-262", "project": "STL IA", "type": "Task", "summary": "[IA] Criação do Checklist | ENG", "assignee": "Michel Angelo", "reporter": "João Crescioni", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "BACK-45", "created": "22/06/2026 14:53:13", "dataInicio": null, "dataConcl": "06/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-261", "project": "STL IA", "type": "Task", "summary": "Layered Sculpture - Criar forma de comunicar a finalidade do bloco gerado junto ao modelo nos filtros (prompts) de personagens e rostos (vide vídeo e imagem)", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "23/04/2026 09:22:31", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-260", "project": "STL IA", "type": "Story", "summary": "[IA] Checklist | PT BR", "assignee": "Michel Angelo", "reporter": "João Gonzalez", "developer": "João Crescioni", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": "BACK-45", "created": "18/06/2026 10:57:52", "dataInicio": null, "dataConcl": "06/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-259", "project": "STL IA", "type": "Story", "summary": "[ Data ] Avaliação (MEDIANA) ativação de usuários", "assignee": "Michel Angelo", "reporter": "Michel Angelo", "developer": "Michel Angelo", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "23/04/2026 11:00:24", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-258", "project": "STL IA", "type": "Story", "summary": "Aumentar a área das fotos do \"make it yours\" and \"Exclusive, unique\". Dependendo do produto não é possível colocar sem fundo e aí as imagens ficam muit pequenas ou até cortadas.", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da sprint UX", "stage": "Pronta pra dev", "tipo": null, "parent": null, "created": "23/04/2026 09:18:06", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-257", "project": "STL IA", "type": "Story", "summary": "Trazer ações/ botões de salvar e excluir modelos da biblioteca para o card do modelo (fora do menu das bolinhas), a fim de deixar evidente para o usuário as ações de salvamento e exclusão", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": null, "created": "23/04/2026 09:18:01", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-255", "project": "STL IA", "type": "Story", "summary": "Selo COLOR EXPORT", "assignee": "João Crescioni", "reporter": "silvana souza", "developer": "João Crescioni", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": "IA-129", "created": "27/05/2026 18:00:02", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-254", "project": "STL IA", "type": "Story", "summary": "Novas alterações STL SALES Home", "assignee": "João Crescioni", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-8", "created": "05/05/2026 17:47:03", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-252", "project": "STL IA", "type": "Story", "summary": "[STLAI]  Feedbacks e NPS na STLAI", "assignee": "Michel Angelo", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da sprint UX", "stage": "Pronta pra dev", "tipo": null, "parent": null, "created": "23/04/2026 09:21:54", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-251", "project": "STL IA", "type": "Story", "summary": "Redesign estratégico da Home STLAI", "assignee": "João Crescioni", "reporter": "Michel Angelo", "developer": "Michel Angelo", "tester": null, "status": "Em design", "stage": "Em design", "tipo": "Melhoria", "parent": "FLIX-305", "created": "29/07/2026 09:28:27", "dataInicio": "29/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-249", "project": "STL IA", "type": "Story", "summary": "Testes Implementação Amplitude", "assignee": "Michel Angelo", "reporter": "João Gonzalez", "developer": "Michel Angelo", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "23/04/2026 09:21:46", "dataInicio": null, "dataConcl": "23/04/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-248", "project": "STL IA", "type": "Story", "summary": "[DROP #55] Halloween - quadrinhos", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": "CUSTOM-331", "created": "31/07/2026 16:24:25", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-247", "project": "STL IA", "type": "Story", "summary": "[Drop AI #54] Spooky Faces - Clicker", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": "CUSTOM-148", "created": "31/07/2026 16:23:08", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-246", "project": "STL IA", "type": "Story", "summary": "[Drop AI #53] Cake Toppers & Charms", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": null, "status": "Code Review", "stage": "Em dev", "tipo": "Sustentação", "parent": "CUSTOM-292", "created": "31/07/2026 16:21:09", "dataInicio": "03/08/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-245", "project": "STL IA", "type": "Spike", "summary": "Estudo sobre vinculo de customizadores e modelos/produtos", "assignee": "Jonas Tolentino", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Melhoria", "parent": null, "created": "31/07/2026 10:51:48", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-244", "project": "STL IA", "type": "Bug", "summary": "[Intercom] Login stlai", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "31/07/2026 09:49:30", "dataInicio": "31/07/2026", "dataConcl": "31/07/2026", "intercom": true, "epic": false, "priority": "Highest"}, {"key": "IA-243", "project": "STL IA", "type": "Story", "summary": "[Intercom] Alteração do cartão ser diretamente no site", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": "Melhoria", "parent": null, "created": "30/07/2026 10:08:37", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "IA-242", "project": "STL IA", "type": "Story", "summary": "Estudar forma de isolarmos os customizadores da STLAI para ambiente dedicado (STRAPI).", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "30/03/2026 13:52:09", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-241", "project": "STL IA", "type": "Story", "summary": "[DROP #52] - Kitcard Box", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "silvana souza", "tester": "silvana souza", "status": "Pronto P/ Deploy", "stage": "Em dev", "tipo": "Sustentação", "parent": "CUSTOM-337", "created": "27/07/2026 15:24:40", "dataInicio": "27/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-240", "project": "STL IA", "type": "Story", "summary": "[Intercom] Cliente solicita que os arquivos da STLAI, salve em .3mf", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": null, "parent": null, "created": "27/07/2026 09:49:30", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "IA-239", "project": "STL IA", "type": "Story", "summary": "[AI] Nova Header STLAI", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": null, "parent": "BACK-51", "created": "27/07/2026 09:22:08", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-238", "project": "STL IA", "type": "Bug", "summary": "Compra de crédito não disponível", "assignee": "Andre Bisewski", "reporter": "Caroline Araújo da Silva", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "24/07/2026 11:09:40", "dataInicio": "24/07/2026", "dataConcl": "24/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-234", "project": "STL IA", "type": "Task", "summary": "[DROP #51] - Victory Cooler integration", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "23/07/2026 09:06:15", "dataInicio": "23/07/2026", "dataConcl": "27/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-233", "project": "STL IA", "type": "Task", "summary": "REEMBOLSO AI - Gerações de produtos que usam Tripo, durante o período 14/07 à 17/07.", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "20/07/2026 13:59:45", "dataInicio": "22/07/2026", "dataConcl": "28/07/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-232", "project": "STL IA", "type": "Story", "summary": "Varredura de segurança", "assignee": "Caroline Araújo da Silva", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Pronto P/ Deploy", "stage": "Em dev", "tipo": "Sustentação", "parent": null, "created": "18/07/2026 14:06:55", "dataInicio": "18/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-229", "project": "STL IA", "type": "Story", "summary": "[DROP #50]  - MiniMe: Fitness", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "17/07/2026 11:53:32", "dataInicio": "17/07/2026", "dataConcl": "27/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-228", "project": "STL IA", "type": "Task", "summary": "[Intercom] Cobrança indevida após cancelamento de assinatura", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": "Sustentação", "parent": null, "created": "16/07/2026 11:03:12", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-227", "project": "STL IA", "type": "Story", "summary": "Atualizar dados faltantes de drops já lançados", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": null, "status": "Em DEV", "stage": "Em dev", "tipo": "Melhoria", "parent": null, "created": "15/07/2026 16:58:36", "dataInicio": "07/08/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-226", "project": "STL IA", "type": "Incidentes", "summary": "Adição de header para alerta -  Instabilidade no processamento dos modelos coloridos gerados pela tripo", "assignee": "Andre Bisewski", "reporter": "silvana souza", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "14/07/2026 16:40:13", "dataInicio": "14/07/2026", "dataConcl": "16/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-225", "project": "STL IA", "type": "Story", "summary": "Implementar filtro lateral de categorias na seção 'All models'", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": null, "parent": null, "created": "13/07/2026 15:18:28", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-224", "project": "STL IA", "type": "Story", "summary": "[Desk Buddies] geração 2D não está correta. Favor verificar o fluxo", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "13/07/2026 15:07:53", "dataInicio": "13/07/2026", "dataConcl": "27/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-222", "project": "STL IA", "type": "Story", "summary": "[Desk Buddies] Interface quebrada - texto 'Exclusive, unique' sumiu.", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "13/07/2026 14:20:05", "dataInicio": "14/07/2026", "dataConcl": "21/07/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-221", "project": "STL IA", "type": "Story", "summary": "[QA_Wall Keychain support] Eliminar modal de filtros e trazer todos os filtros para página de adição da foto", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": "silvana souza", "status": "Code Review", "stage": "Em dev", "tipo": "Melhoria", "parent": "CUSTOM-60", "created": "13/07/2026 10:27:24", "dataInicio": "15/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-220", "project": "STL IA", "type": "Task", "summary": "[QA_Wall Keychain support] Ajustar textos na etapa de seleção dos filtros de acordo com o recomendado abaixo", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "CUSTOM-60", "created": "13/07/2026 10:19:38", "dataInicio": "13/07/2026", "dataConcl": "21/07/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-218", "project": "STL IA", "type": "Bug", "summary": "[Intercom] Problema com acesso e validação do pacote promocional de aniversário", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "09/07/2026 14:04:32", "dataInicio": "09/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "Highest"}, {"key": "IA-217", "project": "STL IA", "type": "Task", "summary": "Integração DROP #49 -Pop-Up Face Hanger / Gancho Surpresa", "assignee": "silvana souza", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "09/07/2026 10:50:37", "dataInicio": "10/07/2026", "dataConcl": "20/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-216", "project": "STL IA", "type": "Task", "summary": "[Intercom] Problema no acesso às assinaturas após compra do combo Bambulab P2S", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "08/07/2026 12:05:01", "dataInicio": "13/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-215", "project": "STL IA", "type": "Story", "summary": "Criação de CSS ID para o Mini Flexi", "assignee": "Marcelo Augusto", "reporter": "João Crescioni", "developer": "Jonas Tolentino", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "07/07/2026 10:14:07", "dataInicio": "07/07/2026", "dataConcl": "10/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-214", "project": "STL IA", "type": "Bug", "summary": "[Intercom] Erro ao baixar modelo 'button football player'", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "06/07/2026 13:23:27", "dataInicio": "07/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "Highest"}, {"key": "IA-213", "project": "STL IA", "type": "Story", "summary": "Desk Buddies_Adicionar modal/warning para o usuário selecionar um filtro de expressão.", "assignee": "silvana souza", "reporter": "silvana souza", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "03/07/2026 18:03:52", "dataInicio": "20/07/2026", "dataConcl": "27/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-212", "project": "STL IA", "type": "Story", "summary": "Desk Buddies_Mesmo inserindo foto de humano e selecionando o filtro, gera o mesmo erro como se tivesse subido foto de animal", "assignee": "silvana souza", "reporter": "silvana souza", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "03/07/2026 17:56:18", "dataInicio": "20/07/2026", "dataConcl": "20/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-211", "project": "STL IA", "type": "Bug", "summary": "[Intercom] Error Uploading Dog Image in Flexi Creature Creator and Flexi Mesh Pet", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "03/07/2026 15:41:48", "dataInicio": "03/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "Highest"}, {"key": "IA-210", "project": "STL IA", "type": "Task", "summary": "URLs para GetDemo | STLAI", "assignee": "Caroline Araújo da Silva", "reporter": "João Crescioni", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "BACK-46", "created": "30/06/2026 17:09:26", "dataInicio": "03/07/2026", "dataConcl": "03/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-209", "project": "STL IA", "type": "Task", "summary": "[BUSCA_IA] Abrir diretamente o customizador após clicar na sugestão de busca", "assignee": "silvana souza", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "30/06/2026 14:16:05", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-208", "project": "STL IA", "type": "Task", "summary": "[BUSCA_IA] Exibir Customizadores de acordo com a busca", "assignee": "silvana souza", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "30/06/2026 14:04:06", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-207", "project": "STL IA", "type": "Task", "summary": "[BUSCA_IA] Exibir resultados com maior relevância", "assignee": "silvana souza", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "30/06/2026 13:59:11", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-206", "project": "STL IA", "type": "Incidentes", "summary": "Erro no Strapi _ Exclusão de ID 218783", "assignee": "silvana souza", "reporter": "silvana souza", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "30/06/2026 11:57:04", "dataInicio": "13/07/2026", "dataConcl": "13/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-205", "project": "STL IA", "type": "Bug", "summary": "[Intercom] Erro de tela preta na página Head Cutter da STLAI", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "29/06/2026 12:58:44", "dataInicio": "01/07/2026", "dataConcl": "13/07/2026", "intercom": true, "epic": false, "priority": "Highest"}, {"key": "IA-204", "project": "STL IA", "type": "Task", "summary": "Falha no envio de e-mail para cadastro no STLAI", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "22/06/2026 16:18:03", "dataInicio": "24/06/2026", "dataConcl": "24/06/2026", "intercom": true, "epic": false, "priority": "Highest"}, {"key": "IA-202", "project": "STL IA", "type": "Story", "summary": "[GetDemo] Identificar e criar usuários novos na STLIA", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "BACK-46", "created": "22/06/2026 14:35:58", "dataInicio": "26/06/2026", "dataConcl": "06/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-201", "project": "STL IA", "type": "Task", "summary": "Adicionar filtros no Desk Buddies", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "22/06/2026 11:30:44", "dataInicio": "30/06/2026", "dataConcl": "27/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-200", "project": "STL IA", "type": "Task", "summary": "DROP #46 - Halftone Frames / Quadros em Meio-Tom", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "CUSTOM-66", "created": "22/06/2026 11:23:08", "dataInicio": "22/06/2026", "dataConcl": "22/06/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-191", "project": "STL IA", "type": "Story", "summary": "Habilitar exportação em cores para Spring Minis", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "IA-70", "created": "15/06/2026 15:28:55", "dataInicio": "15/06/2026", "dataConcl": "15/06/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-190", "project": "STL IA", "type": "Story", "summary": "Adicionar controle de fila nos modelos 2D - GPT 2.0", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Jonas Tolentino", "tester": "João Gonzalez", "status": "Pronto P/ Deploy", "stage": "Em dev", "tipo": "Inovação", "parent": null, "created": "15/06/2026 13:36:21", "dataInicio": "21/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-188", "project": "STL IA", "type": "Story", "summary": "DROP #45 - Desk Buddy INTEGRAÇÂO", "assignee": "Pedro Henrique A. Cruz", "reporter": "silvana souza", "developer": "Pedro Henrique A. Cruz", "tester": "Pedro Henrique A. Cruz", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "15/06/2026 12:00:05", "dataInicio": "17/06/2026", "dataConcl": "03/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-186", "project": "STL IA", "type": "Bug", "summary": "[STLAI] Redirecionamento no STLAI x LOJA", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "11/06/2026 10:59:25", "dataInicio": "11/06/2026", "dataConcl": "11/06/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-185", "project": "STL IA", "type": "Bug", "summary": "[STLAI] Ajuste redirecionamento da página do Customizador de Luzes Personalizadas no Retry", "assignee": "Jonas Tolentino", "reporter": "Caroline Araújo da Silva", "developer": "Jonas Tolentino", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "11/06/2026 10:56:34", "dataInicio": "10/07/2026", "dataConcl": "13/07/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-183", "project": "STL IA", "type": "Task", "summary": "[BUSCA] Interface desorganizada ao mudar para PT-BR", "assignee": "Jonas Tolentino", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "08/06/2026 16:33:51", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-177", "project": "STL IA", "type": "Task", "summary": "QA_SEARCH BAR_ Não está aparecendo os dois Minime Professions que temos", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Pedro Henrique A. Cruz", "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": "IA-264", "created": "03/06/2026 17:02:57", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-176", "project": "STL IA", "type": "Task", "summary": "QA_SEARCH BAR_ Não está aparecendo todos os drops, exemplo: Trophy lab", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Pedro Henrique A. Cruz", "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": "IA-264", "created": "03/06/2026 18:15:03", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-175", "project": "STL IA", "type": "Task", "summary": "QA_SEARCH BAR_ Não está aparecendo todos os drops, exemplo: Guild Relics", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Pedro Henrique A. Cruz", "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": "IA-264", "created": "03/06/2026 18:09:55", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-174", "project": "STL IA", "type": "Task", "summary": "QA_SEARCH BAR_ Thumbnails não estão carregando", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "silvana souza", "tester": null, "status": "Code Review", "stage": "Em dev", "tipo": "Sustentação", "parent": "IA-264", "created": "03/06/2026 16:58:42", "dataInicio": "03/06/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-173", "project": "STL IA", "type": "Task", "summary": "QA_SEARCH BAR_ Não está aparecendo todos os modelos com 'Mini'", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "silvana souza", "tester": null, "status": "Code Review", "stage": "Em dev", "tipo": "Sustentação", "parent": "IA-264", "created": "03/06/2026 16:54:57", "dataInicio": "03/06/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-172", "project": "STL IA", "type": "Story", "summary": "CLONE - Selo COLOR EXPORT", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "IA-129", "created": "02/06/2026 11:51:47", "dataInicio": "30/06/2026", "dataConcl": "13/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-171", "project": "STL IA", "type": "Task", "summary": "Inconsistent Base and Size Issues in STLAI Generated Bobble Figures", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "02/06/2026 11:12:43", "dataInicio": "03/08/2026", "dataConcl": "03/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-170", "project": "STL IA", "type": "Story", "summary": "[Getdemo] na STLIA", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "BACK-46", "created": "02/06/2026 10:16:11", "dataInicio": "17/06/2026", "dataConcl": "02/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-168", "project": "STL IA", "type": "Story", "summary": "Criar modal de erro para NÃO SELEÇÃO DOS FILTROS'", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "IA-112", "created": "29/05/2026 15:46:22", "dataInicio": "02/07/2026", "dataConcl": "10/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-167", "project": "STL IA", "type": "Story", "summary": "Criar modal de erro que comunique claramente o não preenchimento de campos obrigatórios dos customizadores", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": "Jonas Tolentino", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "IA-112", "created": "28/05/2026 17:55:14", "dataInicio": "13/07/2026", "dataConcl": "13/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-166", "project": "STL IA", "type": "Task", "summary": "Bug plataforma STLAI - Todos os modelos", "assignee": "silvana souza", "reporter": "João Gonzalez", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "28/05/2026 15:23:41", "dataInicio": "03/06/2026", "dataConcl": "03/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-165", "project": "STL IA", "type": "Bug", "summary": "Usuário fica travado ao tentar gerar modelo com duas fotos distintas e ambas não serem reconhecidas pela OpenAI. Precisamos gerar um feedback claro", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "IA-112", "created": "28/05/2026 11:42:35", "dataInicio": "07/07/2026", "dataConcl": "20/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-164", "project": "STL IA", "type": "Story", "summary": "Criar fluxo para envio de email de confirmação de geração do modelo 3D (com ou sem cor)", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": null, "parent": "IA-89", "created": "28/05/2026 09:22:47", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-163", "project": "STL IA", "type": "Story", "summary": "Implementar filtro para modelos coloridos", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": null, "parent": "IA-129", "created": "27/05/2026 18:02:06", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-161", "project": "STL IA", "type": "Story", "summary": "Criação de modelos coloridos em draft (Family magnets e o Make my dog)", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "27/05/2026 15:15:55", "dataInicio": "27/05/2026", "dataConcl": "27/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-160", "project": "STL IA", "type": "Bug", "summary": "Erro ao baixar modelo no STLAI após exportação", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "27/05/2026 14:12:40", "dataInicio": "13/07/2026", "dataConcl": "13/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-159", "project": "STL IA", "type": "Story", "summary": "Permitir que o usuário utilize os modelos da biblioteca, já gerados na STLAI, para aplicar as tools que quiser.", "assignee": "silvana souza", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "IA-144", "created": "25/05/2026 15:50:17", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-158", "project": "STL IA", "type": "Bug", "summary": "Refund processed and lithophane lamp print failure on Bambu 3D printers", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "25/05/2026 15:09:36", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-155", "project": "STL IA", "type": "Bug", "summary": "[STLAI] Barra de menu sobrescrevendo títulos no Profile", "assignee": "Jonas Tolentino", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "25/05/2026 13:44:16", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-154", "project": "STL IA", "type": "Story", "summary": "[DS] Integração DROP#42 - Text Utilities", "assignee": "Pedro Henrique A. Cruz", "reporter": "silvana souza", "developer": "Pedro Henrique A. Cruz", "tester": "Pedro Henrique A. Cruz", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "25/05/2026 11:20:02", "dataInicio": "26/05/2026", "dataConcl": "02/06/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-153", "project": "STL IA", "type": "Story", "summary": "Integrar DROP #43 - Flexi Bobble", "assignee": "Pedro Henrique A. Cruz", "reporter": "silvana souza", "developer": "Pedro Henrique A. Cruz", "tester": "Pedro Henrique A. Cruz", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "21/05/2026 10:26:40", "dataInicio": "03/06/2026", "dataConcl": "03/06/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-152", "project": "STL IA", "type": "Story", "summary": "Integração DROP #42 - Text Utilities", "assignee": "Pedro Henrique A. Cruz", "reporter": "silvana souza", "developer": "João Gonzalez", "tester": "Pedro Henrique A. Cruz", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "21/05/2026 10:25:32", "dataInicio": "01/06/2026", "dataConcl": "02/06/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-151", "project": "STL IA", "type": "Story", "summary": "[DS] Ajustar layout dos filtros para alinhar textos e elementos gráficos.", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": "Marcelo Augusto", "status": "Pronto P/ Deploy", "stage": "Em dev", "tipo": "Melhoria", "parent": null, "created": "21/05/2026 09:42:29", "dataInicio": "28/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-149", "project": "STL IA", "type": "Task", "summary": "Body Missing When Exporting Mini Me Model", "assignee": "silvana souza", "reporter": "João Gonzalez", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "20/05/2026 08:23:10", "dataInicio": "03/06/2026", "dataConcl": "03/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-148", "project": "STL IA", "type": "Task", "summary": "STLAI Custom Lamp Generation Failed with No Retries Available", "assignee": "silvana souza", "reporter": "João Gonzalez", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "20/05/2026 07:16:01", "dataInicio": "25/05/2026", "dataConcl": "25/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-147", "project": "STL IA", "type": "Story", "summary": "Qualidade da geração e consumo variável de créditos", "assignee": "silvana souza", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "IA-144", "created": "19/05/2026 16:29:18", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-146", "project": "STL IA", "type": "Story", "summary": "Workbench integrada com múltiplas Tools", "assignee": "silvana souza", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "IA-144", "created": "19/05/2026 16:26:01", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-145", "project": "STL IA", "type": "Story", "summary": "Image to 3D dentro da seção Tools", "assignee": "silvana souza", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "IA-144", "created": "19/05/2026 16:23:35", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-143", "project": "STL IA", "type": "Story", "summary": "Incosistência nos dados de geração de 2D e 3D - Amplitude", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": null, "parent": "IA-89", "created": "18/05/2026 17:00:34", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-142", "project": "STL IA", "type": "Task", "summary": "Criar contrato para firmar compromisso com o fornecedor da API do Fixer;", "assignee": "silvana souza", "reporter": "silvana souza", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "14/04/2026 15:58:47", "dataInicio": "18/05/2026", "dataConcl": "18/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-141", "project": "STL IA", "type": "Story", "summary": "Revisão de eventos - modelos da FLIX aparecem na IA", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": null, "parent": "IA-89", "created": "18/05/2026 16:16:54", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-139", "project": "STL IA", "type": "Task", "summary": "STLAI model download only includes head, missing full body", "assignee": "silvana souza", "reporter": "João Gonzalez", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "18/05/2026 10:13:03", "dataInicio": "26/05/2026", "dataConcl": "26/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-138", "project": "STL IA", "type": "Task", "summary": "Mini-Me Standard Model Exports Only Head When Clothing Customized", "assignee": "silvana souza", "reporter": "João Gonzalez", "developer": "silvana souza", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "18/05/2026 09:18:53", "dataInicio": "20/05/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-136", "project": "STL IA", "type": "Task", "summary": "Erro na geração do mini me em cores no STLAI", "assignee": "silvana souza", "reporter": "João Gonzalez", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "15/05/2026 14:42:21", "dataInicio": "15/05/2026", "dataConcl": "15/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-135", "project": "STL IA", "type": "Task", "summary": "Erro ao utilizar ferramenta Cake Topper após assinatura", "assignee": "silvana souza", "reporter": "João Gonzalez", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "12/05/2026 16:50:55", "dataInicio": "15/05/2026", "dataConcl": "15/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-134", "project": "STL IA", "type": "Task", "summary": "Problema na geração de modelos na STLAI", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "12/05/2026 13:18:45", "dataInicio": "14/05/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-132", "project": "STL IA", "type": "Task", "summary": "STLAI Image Generation Stuck on 'Generating' with Color Feature", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "11/05/2026 13:59:48", "dataInicio": "15/05/2026", "dataConcl": "20/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-131", "project": "STL IA", "type": "Task", "summary": "Dragon model missing left front finger in Bambu Studio", "assignee": "silvana souza", "reporter": "João Gonzalez", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "11/05/2026 13:37:05", "dataInicio": "15/05/2026", "dataConcl": "15/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-130", "project": "STL IA", "type": "Story", "summary": "Integração customizador DROP #40 - Goal League - Sticker Box", "assignee": "Pedro Henrique A. Cruz", "reporter": "silvana souza", "developer": "Pedro Henrique A. Cruz", "tester": "Pedro Henrique A. Cruz", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "11/05/2026 11:59:37", "dataInicio": "12/05/2026", "dataConcl": "22/05/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-128", "project": "STL IA", "type": "Task", "summary": "[IA] Customizadores", "assignee": "silvana souza", "reporter": "João Gonzalez", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "08/05/2026 15:38:47", "dataInicio": "15/05/2026", "dataConcl": "15/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-126", "project": "STL IA", "type": "Bug", "summary": "Pen Topper está disponível em produção e não foi lançado", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "05/05/2026 15:12:15", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-124", "project": "STL IA", "type": "Story", "summary": "Criar no Stage Family Magnets, Magnetized portrait e Make my dog para teste de cores", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "IA-70", "created": "05/05/2026 09:38:26", "dataInicio": "03/06/2026", "dataConcl": "03/06/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-123", "project": "STL IA", "type": "Story", "summary": "Integração drop #39 Acessórios de Bar", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "29/04/2026 09:57:54", "dataInicio": "12/05/2026", "dataConcl": "12/05/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-121", "project": "STL IA", "type": "Task", "summary": "Bug STLAI - 3D Photo Lamps", "assignee": "silvana souza", "reporter": "João Gonzalez", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "27/04/2026 12:00:03", "dataInicio": "25/05/2026", "dataConcl": "25/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-120", "project": "STL IA", "type": "Task", "summary": "Add lógica PT para campos Make it yours e Exclusive, unique", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "24/04/2026 17:57:12", "dataInicio": "07/07/2026", "dataConcl": "21/07/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-117", "project": "STL IA", "type": "Bug", "summary": "Compra de créditos com a pág em ENG não é possível", "assignee": "Andre Bisewski", "reporter": "silvana souza", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "23/04/2026 11:38:53", "dataInicio": "29/04/2026", "dataConcl": "05/05/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-114", "project": "STL IA", "type": "Story", "summary": "Experiência Padronizada de Customizadores", "assignee": "silvana souza", "reporter": "silvana souza", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "IA-112", "created": "22/04/2026 11:41:14", "dataInicio": "26/06/2026", "dataConcl": "26/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-113", "project": "STL IA", "type": "Story", "summary": "Criar evento para filtros Realista e Toyart", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": null, "parent": "IA-21", "created": "22/04/2026 11:31:38", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-111", "project": "STL IA", "type": "Story", "summary": "Criar tela pra trackear os modelos coloridos gerados e qual o status destes (completo, falhou, etc)", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "IA-70", "created": "21/04/2026 17:22:39", "dataInicio": "12/05/2026", "dataConcl": "22/05/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-110", "project": "STL IA", "type": "Story", "summary": "Subir em Draft o Straw Cup Accessories", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "21/04/2026 16:24:51", "dataInicio": "28/04/2026", "dataConcl": "04/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-109", "project": "STL IA", "type": "Story", "summary": "Deixar o Minime Colorido", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "21/04/2026 11:19:13", "dataInicio": "21/04/2026", "dataConcl": "04/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-92", "project": "STL IA", "type": "Story", "summary": "Incluir STLAI no Clarity", "assignee": "Andre Bisewski", "reporter": "silvana souza", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "IA-89", "created": "17/04/2026 18:00:10", "dataInicio": "29/04/2026", "dataConcl": "06/05/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-91", "project": "STL IA", "type": "Story", "summary": "Criar eventos que faltam para gerações 3D (STLAI)", "assignee": "Andre Bisewski", "reporter": "silvana souza", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "IA-89", "created": "17/04/2026 17:58:23", "dataInicio": "29/04/2026", "dataConcl": "06/05/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-90", "project": "STL IA", "type": "Story", "summary": "Criar eventos faltantes na geração 2D para STLAI", "assignee": "Andre Bisewski", "reporter": "silvana souza", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "IA-89", "created": "17/04/2026 17:57:11", "dataInicio": "29/04/2026", "dataConcl": "06/05/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-88", "project": "STL IA", "type": "Story", "summary": "Cadastro do Custom Cable Catchers", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "17/04/2026 16:16:46", "dataInicio": "04/05/2026", "dataConcl": "04/05/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-80", "project": "STL IA", "type": "Story", "summary": "Links da plataforma - IA", "assignee": "silvana souza", "reporter": "João Gonzalez", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "15/04/2026 17:14:21", "dataInicio": "25/05/2026", "dataConcl": "25/05/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-79", "project": "STL IA", "type": "Story", "summary": "Exportação de modelos coloridos para impressão direta - Family Magnets + Magnetized portraits  + Make my dog", "assignee": "silvana souza", "reporter": "silvana souza", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "IA-70", "created": "15/04/2026 13:47:05", "dataInicio": "18/05/2026", "dataConcl": "09/06/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-76", "project": "STL IA", "type": "Story", "summary": "Exportação de modelos coloridos para impressão direta - Mini me's", "assignee": "silvana souza", "reporter": "silvana souza", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "IA-70", "created": "15/04/2026 11:58:02", "dataInicio": "17/04/2026", "dataConcl": "04/05/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-74", "project": "STL IA", "type": "Story", "summary": "Ajustar filtros expressões.", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": null, "status": "Code Review", "stage": "Em dev", "tipo": "Melhoria", "parent": null, "created": "15/04/2026 11:27:29", "dataInicio": "28/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-73", "project": "STL IA", "type": "Task", "summary": "Criar contrato para firmar compromisso com o fornecedor da API do Fixer", "assignee": "silvana souza", "reporter": "silvana souza", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "IA-70", "created": "14/04/2026 17:54:44", "dataInicio": "15/04/2026", "dataConcl": "18/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-72", "project": "STL IA", "type": "Task", "summary": "Criar guide/documentação do passo a passo de como implementar a funcionalidade das cores;", "assignee": "silvana souza", "reporter": "silvana souza", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "IA-70", "created": "14/04/2026 15:51:00", "dataInicio": "27/04/2026", "dataConcl": "04/05/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-71", "project": "STL IA", "type": "Story", "summary": "Exportação de modelos coloridos para impressão direta - Mini-Flexi", "assignee": "silvana souza", "reporter": "silvana souza", "developer": "silvana souza", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "IA-70", "created": "14/04/2026 15:46:53", "dataInicio": "17/04/2026", "dataConcl": "04/05/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-68", "project": "STL IA", "type": "Bug", "summary": "Campo de tempo está zerado nos Cursos da IA", "assignee": "Jonas Tolentino", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "07/04/2026 17:33:30", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-62", "project": "STL IA", "type": "Story", "summary": "Fluxo para luminárias litophane Drop dia 16/04", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": null, "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "06/04/2026 14:06:24", "dataInicio": "09/04/2026", "dataConcl": "17/04/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-61", "project": "STL IA", "type": "Incidentes", "summary": "[STLAI] Dados de cadastros se perdendo", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "30/03/2026 23:14:36", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-59", "project": "STL IA", "type": "Story", "summary": "Criar fluxo n8n para  Useful Keychains", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "31/03/2026 11:21:57", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-58", "project": "STL IA", "type": "Incidentes", "summary": "Sumiço dos campos realista + toyart e suas expressões, de todos os customizadores que havia sido implementado", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "30/03/2026 15:22:57", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-57", "project": "STL IA", "type": "Story", "summary": "Planejar forma de isolarmos os customizadores da STLAI para ambiente dedicado (STRAPI).", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "30/03/2026 14:03:05", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-55", "project": "STL IA", "type": "Story", "summary": "Identificar problema no strapi ao salvar os customizadores", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "27/03/2026 16:50:01", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-52", "project": "STL IA", "type": "Story", "summary": "Testar fluxo novo para customizador Stanley accessories + integrar prompt N8N", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "25/03/2026 13:55:03", "dataInicio": null, "dataConcl": "17/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-51", "project": "STL IA", "type": "Story", "summary": "Stanley accessories - Mandela dar suporte ao Jon", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "24/03/2026 10:49:35", "dataInicio": null, "dataConcl": "17/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-50", "project": "STL IA", "type": "Story", "summary": "Alterar Idiomas para Pt-Br do Tipo de Personalização", "assignee": "Marcelo Augusto", "reporter": "Caroline Araújo da Silva", "developer": "Pedro Henrique A. Cruz", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "23/03/2026 09:59:31", "dataInicio": "01/06/2026", "dataConcl": "20/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-49", "project": "STL IA", "type": "Story", "summary": "Meme me", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "20/03/2026 17:17:21", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-48", "project": "STL IA", "type": "Story", "summary": "Meme me (banheiro)", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "20/03/2026 17:17:06", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-47", "project": "STL IA", "type": "Story", "summary": "Minime Book Accessories", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "20/03/2026 16:48:08", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-46", "project": "STL IA", "type": "Story", "summary": "Minime Incense holder", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "20/03/2026 16:44:34", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-45", "project": "STL IA", "type": "Story", "summary": "Wine holder (nos dois)", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "20/03/2026 16:35:58", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-44", "project": "STL IA", "type": "Story", "summary": "Minime Gamer", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "20/03/2026 16:25:30", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-43", "project": "STL IA", "type": "Story", "summary": "Roll with me", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "20/03/2026 16:07:44", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-42", "project": "STL IA", "type": "Story", "summary": "Planters", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "20/03/2026 12:09:03", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-41", "project": "STL IA", "type": "Story", "summary": "Brainy treats", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "20/03/2026 10:17:10", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-40", "project": "STL IA", "type": "Story", "summary": "Pourtrait - Can holders", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "20/03/2026 10:13:11", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-39", "project": "STL IA", "type": "Story", "summary": "Step buddies", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "20/03/2026 10:04:11", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-38", "project": "STL IA", "type": "Story", "summary": "Minime Christmas", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "20/03/2026 09:51:34", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-37", "project": "STL IA", "type": "Story", "summary": "Minime Useful", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "19/03/2026 16:17:00", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-36", "project": "STL IA", "type": "Story", "summary": "Minime Sports", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "19/03/2026 16:11:36", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-35", "project": "STL IA", "type": "Story", "summary": "Minime Professions II", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "19/03/2026 15:51:49", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-34", "project": "STL IA", "type": "Story", "summary": "Minime Professions I", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "19/03/2026 15:41:22", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-33", "project": "STL IA", "type": "Story", "summary": "Minime", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "IA-21", "created": "18/03/2026 01:34:46", "dataInicio": "06/04/2026", "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-32", "project": "STL IA", "type": "Story", "summary": "Adicionar campo de busca", "assignee": "Pedro Henrique A. Cruz", "reporter": "silvana souza", "developer": "Pedro Henrique A. Cruz", "tester": "Pedro Henrique A. Cruz", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "17/03/2026 18:06:07", "dataInicio": "25/05/2026", "dataConcl": "01/06/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-31", "project": "STL IA", "type": "Task", "summary": "Teste da API de repair", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "16/03/2026 13:56:44", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-30", "project": "STL IA", "type": "Bug", "summary": "[SLTAI] Problema com camadas flutuantes no 3D gerado pelo Magnetized Portraits", "assignee": "silvana souza", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "16/03/2026 10:31:22", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-28", "project": "STL IA", "type": "Story", "summary": "Fluxo Clothes can holder e Acessórios Stanley", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "13/03/2026 10:05:45", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-27", "project": "STL IA", "type": "Story", "summary": "Padronizar layout dos filtros (prompts)", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": null, "status": "Code Review", "stage": "Em dev", "tipo": "Melhoria", "parent": null, "created": "12/03/2026 16:48:22", "dataInicio": "08/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-26", "project": "STL IA", "type": "Story", "summary": "[AI] - Adicionar o novo modelo Phone Holder", "assignee": "silvana souza", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "12/03/2026 16:39:52", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "IA-25", "project": "STL IA", "type": "Task", "summary": "Atualizar todos os customizadores para tripo 3.0", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "IA-21", "created": "12/03/2026 16:29:53", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-24", "project": "STL IA", "type": "Story", "summary": "[Minime] Implementar prompt realista e suas expressões", "assignee": "Marcelo Augusto", "reporter": "silvana souza", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "IA-21", "created": "12/03/2026 16:25:05", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-19", "project": "STL IA", "type": "Bug", "summary": "[STLAI] Créditos com valor de Lifetime para planos Mensais com status Expirado", "assignee": "Andre Bisewski", "reporter": "Caroline Araújo da Silva", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "12/03/2026 14:26:43", "dataInicio": "29/04/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-18", "project": "STL IA", "type": "Bug", "summary": "[STLAI] Link de compra do plano Lifetime (EN) indisponível", "assignee": "Andre Bisewski", "reporter": "Caroline Araújo da Silva", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "12/03/2026 14:25:55", "dataInicio": "29/04/2026", "dataConcl": "05/05/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "IA-16", "project": "STL IA", "type": "Bug", "summary": "No menu 'Minhas criações', o usuário consegue selecionar um modelo já criado e abrir em customizadores que não são compatíveis com essa criação.", "assignee": "Jonas Tolentino", "reporter": "silvana souza", "developer": "Jonas Tolentino", "tester": null, "status": "Em DEV", "stage": "Em dev", "tipo": "Sustentação", "parent": null, "created": "11/03/2026 15:13:59", "dataInicio": "28/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-13", "project": "STL IA", "type": "Story", "summary": "[AI] Modal de lançamento padrão", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-6", "project": "STL IA", "type": "Story", "summary": "[AI]  Criar automatização das mídias do Media Package da STLAI", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Pedro Henrique A. Cruz", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-4", "project": "STL IA", "type": "Task", "summary": "[AI] Modelo SVG  não abre customizadores para edição", "assignee": "Jonas Tolentino", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "IA-3", "project": "STL IA", "type": "Story", "summary": "[AI] Evento de conversão nos geradores", "assignee": "silvana souza", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "IA-21", "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "normal"}, {"key": "IA-2", "project": "STL IA", "type": "Story", "summary": "[AI]  Alterar layout da seção de Media Package", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "silvana souza", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": "19/05/2026", "dataConcl": "24/06/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-356", "project": "STLFLIX", "type": "Story", "summary": "Produtos com estoque primeiro e produtos sem estoque no final.", "assignee": "Marcelo Augusto", "reporter": "Marcelo Augusto", "developer": "Marcelo Augusto", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "07/08/2026 14:58:39", "dataInicio": "07/08/2026", "dataConcl": "07/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-355", "project": "STLFLIX", "type": "Bug", "summary": "[FLIX] Botão de Filamento redireciona para página não encontrada", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": null, "created": "06/08/2026 10:33:41", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "FLIX-354", "project": "STLFLIX", "type": "Story", "summary": "Criação dos planos do Mercado Pago Argentina via Backoffice", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": null, "status": "Pronta p/ teste", "stage": "Em dev", "tipo": "Melhoria", "parent": "FLIX-257", "created": "05/08/2026 16:29:26", "dataInicio": "05/08/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-353", "project": "STLFLIX", "type": "Story", "summary": "Integração Front e Back", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": null, "status": "Pronta p/ teste", "stage": "Em dev", "tipo": "Inovação", "parent": "FLIX-257", "created": "05/08/2026 12:10:49", "dataInicio": "05/08/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-351", "project": "STLFLIX", "type": "Bug", "summary": "Drop aparecendo antes do tempo", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Pronto P/ Deploy", "stage": "Em dev", "tipo": "Sustentação", "parent": null, "created": "05/08/2026 09:32:31", "dataInicio": "05/08/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-350", "project": "STLFLIX", "type": "Bug", "summary": "[Intercom] Cliente sem Cupons referente a assinatura de 4 anos", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "05/08/2026 09:23:00", "dataInicio": "05/08/2026", "dataConcl": "05/08/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-349", "project": "STLFLIX", "type": "Bug", "summary": "[FLIX] Indicador de notificação duplicado na navbar", "assignee": "João Crescioni", "reporter": "João Crescioni", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "FLIX-305", "created": "04/08/2026 20:42:58", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-348", "project": "STLFLIX", "type": "Spike", "summary": "Integração Mercado Pago + ARCA", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": null, "parent": "FLIX-257", "created": "04/08/2026 14:16:10", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-344", "project": "STLFLIX", "type": "Task", "summary": "[Flix] Criação do Checklist | PT BR", "assignee": "Michel Angelo", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "BACK-45", "created": "18/06/2026 10:54:30", "dataInicio": null, "dataConcl": "06/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-343", "project": "STLFLIX", "type": "Task", "summary": "[FLIX] Criação do Checklist | ENG", "assignee": "Michel Angelo", "reporter": "João Crescioni", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "BACK-45", "created": "22/06/2026 14:52:53", "dataInicio": null, "dataConcl": "06/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-342", "project": "STLFLIX", "type": "Story", "summary": "Reestruturação do Site Institucional STLFLIX", "assignee": "Michel Angelo", "reporter": "Michel Angelo", "developer": "Michel Angelo", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "19/05/2026 09:17:57", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-341", "project": "STLFLIX", "type": "Story", "summary": "Seletor de idiomas Pt/Br", "assignee": "Michel Angelo", "reporter": "João Gonzalez", "developer": "Michel Angelo", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "23/04/2026 09:17:56", "dataInicio": null, "dataConcl": "23/04/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "FLIX-339", "project": "STLFLIX", "type": "Story", "summary": "Alteração dos filtros STLFlix", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": "João Crescioni", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": "FLIX-142", "created": "02/06/2026 10:25:13", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-338", "project": "STLFLIX", "type": "Story", "summary": "NPS GERAL PLATAFORMA", "assignee": "Michel Angelo", "reporter": "João Gonzalez", "developer": "Michel Angelo", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "23/04/2026 09:18:11", "dataInicio": null, "dataConcl": "29/04/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-336", "project": "STLFLIX", "type": "Story", "summary": "Modal e Faixa Promoção Aniversario", "assignee": "João Gonzalez", "reporter": "Michel Angelo", "developer": "Michel Angelo", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "14/07/2026 12:55:50", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-334", "project": "STLFLIX", "type": "Story", "summary": "Redesign Estratégico da Home STLFLIX", "assignee": "João Crescioni", "reporter": "Michel Angelo", "developer": "Michel Angelo", "tester": null, "status": "Em design", "stage": "Em design", "tipo": "Melhoria", "parent": "ACADEMY-45", "created": "16/07/2026 13:12:02", "dataInicio": "16/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-333", "project": "STLFLIX", "type": "Story", "summary": "[ Data ] Avaliação (MEDIANA) ativação de usuários", "assignee": "João Gonzalez", "reporter": "Michel Angelo", "developer": "Michel Angelo", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "23/04/2026 10:59:34", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-332", "project": "STLFLIX", "type": "Story", "summary": "Ações Engajamento", "assignee": "Michel Angelo", "reporter": "Michel Angelo", "developer": null, "tester": null, "status": "Fila da sprint UX", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": "FLIX-305", "created": "31/07/2026 18:20:25", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-330", "project": "STLFLIX", "type": "Story", "summary": "Alterações nova categoria community ideas", "assignee": "Michel Angelo", "reporter": "Michel Angelo", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "06/05/2026 10:22:57", "dataInicio": null, "dataConcl": "15/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-329", "project": "STLFLIX", "type": "Story", "summary": "Testes Implementação Amplitude", "assignee": "Michel Angelo", "reporter": "João Gonzalez", "developer": "Michel Angelo", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "23/04/2026 09:17:51", "dataInicio": null, "dataConcl": "23/04/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-326", "project": "STLFLIX", "type": "Bug", "summary": "[Intercom] Bug na barra de pesquisa", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": null, "parent": null, "created": "04/08/2026 12:00:38", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-325", "project": "STLFLIX", "type": "Bug", "summary": "[Scroll] Z-index dos elementos vs nova navbar", "assignee": "Andre Bisewski", "reporter": "João Crescioni", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Em testes", "stage": "Em dev", "tipo": "Sustentação", "parent": "BACK-51", "created": "04/08/2026 10:29:12", "dataInicio": "04/08/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-324", "project": "STLFLIX", "type": "Bug", "summary": "[Header] Problema na libração dos cursos ao vivo", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "BACK-51", "created": "04/08/2026 10:09:54", "dataInicio": "04/08/2026", "dataConcl": "06/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-322", "project": "STLFLIX", "type": "Story", "summary": "Melhoria de performance e custos da platforma STLFLIX", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": null, "status": "Code Review", "stage": "Em dev", "tipo": "Melhoria", "parent": null, "created": "03/08/2026 13:25:52", "dataInicio": "03/08/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-321", "project": "STLFLIX", "type": "Task", "summary": "[Intercom] O cliente não recebeu o e-mail com os cupons de desconto da Creality.", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": null, "created": "31/07/2026 15:09:57", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-320", "project": "STLFLIX", "type": "Bug", "summary": "[Intercom] não gera o sinete com a logo", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Aguardado suporte", "stage": "Análise técnica", "tipo": null, "parent": null, "created": "30/07/2026 09:23:06", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-319", "project": "STLFLIX", "type": "Bug", "summary": "[Intercom] Não está traduzindo completa a página de Inglês para PT-BR", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": null, "created": "30/07/2026 07:59:19", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-318", "project": "STLFLIX", "type": "Spike", "summary": "Exploração técnica: conexão com APIs do Mercado Pago Argentina no ecossistema STLFlix", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "João Gonzalez", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "FLIX-257", "created": "29/07/2026 18:22:50", "dataInicio": "04/08/2026", "dataConcl": "06/08/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "FLIX-317", "project": "STLFLIX", "type": "Story", "summary": "Novo layout STLFlix - Troca da Home", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da sprint UX", "stage": "Pronta pra dev", "tipo": null, "parent": "FLIX-305", "created": "29/07/2026 18:21:42", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-316", "project": "STLFLIX", "type": "Bug", "summary": "[Intercom] Cliente sem acesso a turma 8 do Vivendo de Impressão 3D", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": "Sustentação", "parent": null, "created": "29/07/2026 15:29:20", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-311", "project": "STLFLIX", "type": "Bug", "summary": "Problema na tradução de Português", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "28/07/2026 14:18:40", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-307", "project": "STLFLIX", "type": "Bug", "summary": "Produto aparecendo da Flix antes do lançamento", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "27/07/2026 15:17:51", "dataInicio": "27/07/2026", "dataConcl": "03/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-306", "project": "STLFLIX", "type": "Story", "summary": "[Flix] Nova Header STLFlix", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "BACK-51", "created": "27/07/2026 09:20:50", "dataInicio": "27/07/2026", "dataConcl": "06/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-304", "project": "STLFLIX", "type": "Bug", "summary": "[MyStore] Frete sendo calculado como EUA x BRASIL em vez de BRASIL X BRASIL", "assignee": "Marcelo Augusto", "reporter": "Caroline Araújo da Silva", "developer": "Caroline Araújo da Silva", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "24/07/2026 13:41:13", "dataInicio": "24/07/2026", "dataConcl": "05/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-296", "project": "STLFLIX", "type": "Task", "summary": "Ressarcimento de Coins na FLIX do usuário", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "17/07/2026 18:34:33", "dataInicio": "05/08/2026", "dataConcl": "05/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-295", "project": "STLFLIX", "type": "Bug", "summary": "Erro ao gerar Anúncio", "assignee": "Marcelo Augusto", "reporter": "Caroline Araújo da Silva", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "20/07/2026 15:13:47", "dataInicio": "21/07/2026", "dataConcl": "29/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-285", "project": "STLFLIX", "type": "Story", "summary": "[ES] Traduzir todas strings da FLIX para Espanhol hardcoded", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": null, "tester": "Caroline Araújo da Silva", "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": null, "parent": "FLIX-283", "created": "20/07/2026 09:47:23", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-284", "project": "STLFLIX", "type": "Story", "summary": "[ES] STLFlix em espanhol", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": "FLIX-283", "created": "20/07/2026 09:47:21", "dataInicio": "22/07/2026", "dataConcl": "31/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-282", "project": "STLFLIX", "type": "Story", "summary": "Atualização de segurança dos STL's no S3", "assignee": "Pedro Henrique A. Cruz", "reporter": "Andre Bisewski", "developer": "Pedro Henrique A. Cruz", "tester": null, "status": "Em DEV", "stage": "Em dev", "tipo": "Sustentação", "parent": null, "created": "18/07/2026 22:48:08", "dataInicio": "22/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-281", "project": "STLFLIX", "type": "Story", "summary": "Varredura geral de segurança", "assignee": "Caroline Araújo da Silva", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Pronto P/ Deploy", "stage": "Em dev", "tipo": "Sustentação", "parent": null, "created": "17/07/2026 11:27:21", "dataInicio": "17/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-280", "project": "STLFLIX", "type": "Bug", "summary": "[Intercom] Problema ao baixar modelo de rosto para impressão 3D", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "17/07/2026 09:27:37", "dataInicio": "23/07/2026", "dataConcl": "23/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-278", "project": "STLFLIX", "type": "Story", "summary": "Header + Pop-up personalizados da Oferta", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "15/07/2026 17:03:16", "dataInicio": "16/07/2026", "dataConcl": "24/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-277", "project": "STLFLIX", "type": "Story", "summary": "Modelo padrão de download", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Pronto P/ Deploy", "stage": "Em dev", "tipo": "Melhoria", "parent": "BACK-46", "created": "15/07/2026 16:48:27", "dataInicio": "23/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-276", "project": "STLFLIX", "type": "Task", "summary": "[Melhoria - STLFLIX] Opção de Personalizar a Coleção do usuário", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "15/07/2026 13:35:43", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-273", "project": "STLFLIX", "type": "Task", "summary": "[Intercom] Coleção de modelos não abre, redireciona para página inicial", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "15/07/2026 12:08:42", "dataInicio": "15/07/2026", "dataConcl": "23/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-266", "project": "STLFLIX", "type": "Bug", "summary": "[Intercom] Subscription Duration and Payment Verification Issues", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "15/07/2026 10:05:41", "dataInicio": "15/07/2026", "dataConcl": "23/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-265", "project": "STLFLIX", "type": "Task", "summary": "Plano mensal cadastrado incorretamente como Ilimitado", "assignee": "Andre Bisewski", "reporter": "Caroline Araújo da Silva", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Pronto P/ Deploy", "stage": "Em dev", "tipo": "Sustentação", "parent": null, "created": "14/07/2026 14:44:47", "dataInicio": "04/08/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "FLIX-264", "project": "STLFLIX", "type": "Task", "summary": "[Intercom] Dúvidas sobre upgrade e acesso a modelos no plano anual da STLFLIX", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "14/07/2026 13:47:41", "dataInicio": "15/07/2026", "dataConcl": "14/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-262", "project": "STLFLIX", "type": "Bug", "summary": "[Intercom] Problemas de navegação e header piscando no macOS", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "13/07/2026 14:13:43", "dataInicio": "13/07/2026", "dataConcl": "13/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-261", "project": "STLFLIX", "type": "Story", "summary": "Atualizar com o Cronograma completo de aulas - Página 4 anos", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-48", "created": "13/07/2026 13:32:34", "dataInicio": "14/07/2026", "dataConcl": "16/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-260", "project": "STLFLIX", "type": "Story", "summary": "Loja em espanhol", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "FLIX-257", "created": "13/07/2026 11:00:26", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-259", "project": "STLFLIX", "type": "Story", "summary": "Integração com Ranko", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "FLIX-257", "created": "13/07/2026 11:00:21", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-258", "project": "STLFLIX", "type": "Story", "summary": "[AR] Conexão MercadoPago", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "FLIX-257", "created": "13/07/2026 11:00:10", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-256", "project": "STLFLIX", "type": "Bug", "summary": "[STLFLIX_US] Falha na integração de compras do plano US - ANUAL - GET", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "13/07/2026 10:41:30", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-255", "project": "STLFLIX", "type": "Bug", "summary": "[Intercom] Account Creation Failure and Login Issues for Walter Smith", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "13/07/2026 09:27:53", "dataInicio": "13/07/2026", "dataConcl": "13/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-254", "project": "STLFLIX", "type": "Task", "summary": "Gateway de pagamento das impressoras e integração loja e STL Seller", "assignee": "Andre Bisewski", "reporter": "Ray Lima", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 16:02:51", "dataInicio": "14/07/2026", "dataConcl": "16/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-253", "project": "STLFLIX", "type": "Task", "summary": "Retirar informações ds FAQs", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 15:15:23", "dataInicio": "10/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-252", "project": "STLFLIX", "type": "Task", "summary": "Alterar nome no menu - Aulas Extras", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 14:48:32", "dataInicio": "10/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-251", "project": "STLFLIX", "type": "Task", "summary": "PÁGINA DE UPSELL Global", "assignee": "Andre Bisewski", "reporter": "Ray Lima", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 14:38:53", "dataInicio": "10/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-250", "project": "STLFLIX", "type": "Task", "summary": "PÁGINA DE UPSELL BR", "assignee": "Andre Bisewski", "reporter": "Ray Lima", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 14:33:22", "dataInicio": "10/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-249", "project": "STLFLIX", "type": "Task", "summary": "Novas datas dos cursos", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 14:26:21", "dataInicio": "10/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-248", "project": "STLFLIX", "type": "Task", "summary": "[FLIX-FILAMENTO] Créditos de plano 4 anos está substituindo créditos anteriores", "assignee": "Andre Bisewski", "reporter": "Caroline Araújo da Silva", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "09/07/2026 16:23:56", "dataInicio": "10/07/2026", "dataConcl": "27/07/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "FLIX-247", "project": "STLFLIX", "type": "Bug", "summary": "[Intercom] Problema com desconto e créditos na compra do plano 4 anos", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "09/07/2026 15:21:51", "dataInicio": "09/07/2026", "dataConcl": "09/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-246", "project": "STLFLIX", "type": "Bug", "summary": "[Intercom] Créditos de filamentos do plano STLflix não creditados desde junho", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "09/07/2026 11:37:32", "dataInicio": "09/07/2026", "dataConcl": "13/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-243", "project": "STLFLIX", "type": "Story", "summary": "[Intercom] Solicitação de carta de autorização para venda em marketplace", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "08/07/2026 13:51:37", "dataInicio": "08/07/2026", "dataConcl": "13/07/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "FLIX-242", "project": "STLFLIX", "type": "Story", "summary": "Desativar onboarding atual para os planos da oferta de 4 anos", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "08/07/2026 11:33:33", "dataInicio": "08/07/2026", "dataConcl": "14/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-241", "project": "STLFLIX", "type": "Task", "summary": "Embed - Assinantes vitalicios - Plataforma Global", "assignee": "Andre Bisewski", "reporter": "Ray Lima", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "07/07/2026 19:18:59", "dataInicio": "09/07/2026", "dataConcl": "09/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-240", "project": "STLFLIX", "type": "Task", "summary": "Página de upsell para vitalícios  GLOBAL STLFLIX", "assignee": "Andre Bisewski", "reporter": "Ray Lima", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "08/07/2026 09:36:54", "dataInicio": "09/07/2026", "dataConcl": "16/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-239", "project": "STLFLIX", "type": "Task", "summary": "Embed - Assinantes vitalicios - Plataforma BR", "assignee": "Andre Bisewski", "reporter": "Ray Lima", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "07/07/2026 19:14:25", "dataInicio": "09/07/2026", "dataConcl": "09/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-238", "project": "STLFLIX", "type": "Bug", "summary": "[Onboarding] Verificar steps Onboarding do STLFLIX", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "07/07/2026 11:04:21", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "FLIX-236", "project": "STLFLIX", "type": "Task", "summary": "[Intercom] Erro na ativação e download após assinatura", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "06/07/2026 13:27:02", "dataInicio": "07/07/2026", "dataConcl": "13/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-233", "project": "STLFLIX", "type": "Story", "summary": "Passar o finder na planilha do Etsy", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "João Gonzalez", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "SELLER-29", "created": "03/07/2026 11:04:47", "dataInicio": "04/07/2026", "dataConcl": "09/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-232", "project": "STLFLIX", "type": "Task", "summary": "Criação de ambientes  dos Cursos ao vivo", "assignee": "Ray Lima", "reporter": "Ray Lima", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "02/07/2026 17:04:32", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-231", "project": "STLFLIX", "type": "Task", "summary": "Mudanças para aniversário no menubar da plataforma", "assignee": "Ray Lima", "reporter": "Ray Lima", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "02/07/2026 17:03:54", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-230", "project": "STLFLIX", "type": "Bug", "summary": "[Intercom] Problema de integração na conta da plataforma para cliente com P2S Combo", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "02/07/2026 16:44:03", "dataInicio": "03/07/2026", "dataConcl": "13/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-228", "project": "STLFLIX", "type": "Task", "summary": "[Intercom] Opção de cancelar por dentro da conta.", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "02/07/2026 10:48:19", "dataInicio": "02/07/2026", "dataConcl": "15/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-227", "project": "STLFLIX", "type": "Story", "summary": "[Intercom] Suggestion for Bulk Model Download via Google Drive", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": "João Gonzalez", "tester": "João Gonzalez", "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "02/07/2026 10:03:21", "dataInicio": "03/08/2026", "dataConcl": "03/08/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "FLIX-226", "project": "STLFLIX", "type": "Story", "summary": "Subir infra do Seller", "assignee": "Pedro Henrique A. Cruz", "reporter": "Andre Bisewski", "developer": "Pedro Henrique A. Cruz", "tester": "Pedro Henrique A. Cruz", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "01/07/2026 18:00:58", "dataInicio": "03/07/2026", "dataConcl": "16/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-225", "project": "STLFLIX", "type": "Bug", "summary": "[MYSTORE] Erro ao adicionar Atributo", "assignee": "Marcelo Augusto", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "01/07/2026 16:32:06", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-220", "project": "STLFLIX", "type": "Task", "summary": "URLs para GetDemo | STLFLIX", "assignee": "Andre Bisewski", "reporter": "João Crescioni", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "BACK-46", "created": "30/06/2026 16:37:31", "dataInicio": "13/07/2026", "dataConcl": "24/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-219", "project": "STLFLIX", "type": "Story", "summary": "Atualizar Macro Categoria dos produtos via banco de dados a partir de planilha", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "FLIX-168", "created": "01/07/2026 09:52:44", "dataInicio": "02/07/2026", "dataConcl": "06/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-218", "project": "STLFLIX", "type": "Bug", "summary": "Compra de order bump não integrada no backend", "assignee": "Ray Lima", "reporter": "Ray Lima", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "30/06/2026 16:13:35", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-217", "project": "STLFLIX", "type": "Task", "summary": "Compra Order Bump com desconto no primeiro mês", "assignee": "Ray Lima", "reporter": "Ray Lima", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "30/06/2026 15:44:57", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-216", "project": "STLFLIX", "type": "Bug", "summary": "Order Bump não aparece na versão mobile", "assignee": "Ray Lima", "reporter": "Ray Lima", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "30/06/2026 15:41:42", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "FLIX-213", "project": "STLFLIX", "type": "Task", "summary": "[Intercom] Download Issues", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "26/06/2026 11:51:43", "dataInicio": "29/06/2026", "dataConcl": "13/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-212", "project": "STLFLIX", "type": "Task", "summary": "[Intercom] Some parte da descrição do modelo quando altera para PT-BR", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "25/06/2026 14:41:55", "dataInicio": "25/06/2026", "dataConcl": "13/07/2026", "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-211", "project": "STLFLIX", "type": "Story", "summary": "Exibição automática dos guias GetDemo - 7 dias", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": "BACK-46", "created": "25/06/2026 09:32:30", "dataInicio": "26/06/2026", "dataConcl": "02/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-210", "project": "STLFLIX", "type": "Bug", "summary": "Tela de primeira tela não carrega", "assignee": "Ray Lima", "reporter": "Ray Lima", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "23/06/2026 09:33:35", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-209", "project": "STLFLIX", "type": "Task", "summary": "Adicionar script ao header da loja br e get.stlflix (CRO)", "assignee": "Andre Bisewski", "reporter": "Ray Lima", "developer": "João Gonzalez", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "23/06/2026 09:25:35", "dataInicio": "30/06/2026", "dataConcl": "02/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-208", "project": "STLFLIX", "type": "Task", "summary": "Adicionar script ao header da loja br e lp.stlflix (CRO)", "assignee": "Andre Bisewski", "reporter": "Ray Lima", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "23/06/2026 09:05:05", "dataInicio": "25/06/2026", "dataConcl": "30/06/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-206", "project": "STLFLIX", "type": "Story", "summary": "banner em inglês mesmo com idioma PT-BR selecionado", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": null, "parent": null, "created": "19/06/2026 16:55:10", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "High"}, {"key": "FLIX-205", "project": "STLFLIX", "type": "Story", "summary": "[Intercom] Sugestão de melhoria - API pública", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": "João Gonzalez", "tester": "João Gonzalez", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "18/06/2026 15:41:42", "dataInicio": "19/06/2026", "dataConcl": "19/06/2026", "intercom": true, "epic": false, "priority": "normal"}, {"key": "FLIX-204", "project": "STLFLIX", "type": "Story", "summary": "[Intercom] Sugestão de melhoria - menu Central de ajuda", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": null, "parent": null, "created": "18/06/2026 15:35:59", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "FLIX-203", "project": "STLFLIX", "type": "Story", "summary": "[Intercom] Sugestão de melhoria - explorar modelos e filtros.", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": null, "parent": null, "created": "18/06/2026 15:14:37", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "FLIX-173", "project": "STLFLIX", "type": "Task", "summary": "[MyStore] Extração de Dados de Adoção", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "15/06/2026 14:14:02", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-172", "project": "STLFLIX", "type": "Story", "summary": "[Explore] Aplicar filtros técnicos pelo menu superior do Explore", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": "FLIX-168", "created": "15/06/2026 11:58:10", "dataInicio": "17/06/2026", "dataConcl": "25/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-171", "project": "STLFLIX", "type": "Story", "summary": "[Explore] Remover filtros ativos individualmente ou em bloco", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "FLIX-168", "created": "15/06/2026 11:57:10", "dataInicio": "17/07/2026", "dataConcl": "23/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-170", "project": "STLFLIX", "type": "Story", "summary": "[Explore] Ajustar o número de modelos exibidos por linha no grid", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "FLIX-168", "created": "15/06/2026 11:55:50", "dataInicio": "16/07/2026", "dataConcl": "23/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-169", "project": "STLFLIX", "type": "Story", "summary": "[Exeplore] Filtrar modelos por contexto de venda", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": "FLIX-168", "created": "15/06/2026 11:43:45", "dataInicio": "16/06/2026", "dataConcl": "02/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-167", "project": "STLFLIX", "type": "Story", "summary": "[GetDemo] Segmentar usuários novos por projeto", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "BACK-46", "created": "15/06/2026 11:10:27", "dataInicio": "17/06/2026", "dataConcl": "02/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-166", "project": "STLFLIX", "type": "Story", "summary": "[GetDemo] Identificar e criar usuários novos", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "BACK-46", "created": "15/06/2026 11:09:10", "dataInicio": "17/06/2026", "dataConcl": "02/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-165", "project": "STLFLIX", "type": "Story", "summary": "[MyStore] Intercom na MyStore", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Fila da Sprint", "stage": "Pronta pra dev", "tipo": null, "parent": null, "created": "15/06/2026 10:01:13", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-152", "project": "STLFLIX", "type": "Task", "summary": "Acesso ao domínio da stlflix.com", "assignee": "Pedro Henrique A. Cruz", "reporter": "Lucas Melo", "developer": "Pedro Henrique A. Cruz", "tester": "Pedro Henrique A. Cruz", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "11/06/2026 15:02:46", "dataInicio": "19/06/2026", "dataConcl": "22/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-151", "project": "STLFLIX", "type": "Story", "summary": "Atualização de SSO após atualização do redirect na stlflix.com.br", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "10/06/2026 13:13:08", "dataInicio": "10/06/2026", "dataConcl": "11/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-150", "project": "STLFLIX", "type": "Task", "summary": "Analise de contas sem faturamento", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "10/06/2026 11:53:16", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-149", "project": "STLFLIX", "type": "Task", "summary": "DROP #44 - Personalized Projections", "assignee": "Pedro Henrique A. Cruz", "reporter": "Pedro Henrique A. Cruz", "developer": "Pedro Henrique A. Cruz", "tester": "João Gonzalez", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/06/2026 01:57:22", "dataInicio": "10/06/2026", "dataConcl": "15/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-148", "project": "STLFLIX", "type": "Task", "summary": "[Ambientes]", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "09/06/2026 13:35:54", "dataInicio": "09/06/2026", "dataConcl": "09/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-147", "project": "STLFLIX", "type": "Task", "summary": "[MYSTORE]  Alterar cor da fonte no Checkout da Loja", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "08/06/2026 13:09:41", "dataInicio": "25/06/2026", "dataConcl": "25/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-146", "project": "STLFLIX", "type": "Bug", "summary": "[MYSTORE] Informação de Configuração de provedor de pagamento Incorreta", "assignee": "Marcelo Augusto", "reporter": "Caroline Araújo da Silva", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "08/06/2026 10:42:06", "dataInicio": "08/06/2026", "dataConcl": "08/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-145", "project": "STLFLIX", "type": "Bug", "summary": "Problema MYStore", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "08/06/2026 09:38:02", "dataInicio": "23/06/2026", "dataConcl": "25/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-143", "project": "STLFLIX", "type": "Task", "summary": "upgrade do postgres  para versão 14", "assignee": "Pedro Henrique A. Cruz", "reporter": "Pedro Henrique A. Cruz", "developer": "Pedro Henrique A. Cruz", "tester": "Pedro Henrique A. Cruz", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "03/06/2026 14:08:47", "dataInicio": "03/06/2026", "dataConcl": "03/06/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-141", "project": "STLFLIX", "type": "Story", "summary": "[Getdemo] na flix", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": "BACK-46", "created": "02/06/2026 10:15:41", "dataInicio": "17/06/2026", "dataConcl": "06/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-140", "project": "STLFLIX", "type": "Task", "summary": "Investigar motivo do enchimento dos discos das instâncias mysql", "assignee": "Pedro Henrique A. Cruz", "reporter": "Pedro Henrique A. Cruz", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "26/05/2026 12:44:28", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-138", "project": "STLFLIX", "type": "Story", "summary": "Filtros de Macro Categoria e Categoria Independentes", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "22/05/2026 14:34:32", "dataInicio": "10/06/2026", "dataConcl": "12/06/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-135", "project": "STLFLIX", "type": "Task", "summary": "Solicitação técnica — STLFLIX EN Prioridade", "assignee": "Andre Bisewski", "reporter": "Rene Antonio", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "18/05/2026 18:26:14", "dataInicio": "21/05/2026", "dataConcl": "01/06/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-132", "project": "STLFLIX", "type": "Story", "summary": "Integração DROP #41 - Button Football Player", "assignee": "Pedro Henrique A. Cruz", "reporter": "silvana souza", "developer": "Pedro Henrique A. Cruz", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "18/05/2026 12:08:02", "dataInicio": "19/05/2026", "dataConcl": "13/07/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-131", "project": "STLFLIX", "type": "Bug", "summary": "Cupom de desconto não aplicado na nova assinatura", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "06/05/2026 09:35:07", "dataInicio": "13/05/2026", "dataConcl": "19/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-130", "project": "STLFLIX", "type": "Task", "summary": "[INTEGRAÇÃO] Woo.com x SLTLFIX não integrou no plano \"Print like a pro\" Course + 3 months of STLFLIX Commercial", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "12/05/2026 10:02:53", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-129", "project": "STLFLIX", "type": "Story", "summary": "Migração de Gateway Elite3d para LIA", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": null, "parent": null, "created": "12/05/2026 09:21:42", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-128", "project": "STLFLIX", "type": "Incidentes", "summary": "Drop da semana com Bug", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "11/05/2026 10:36:27", "dataInicio": "11/05/2026", "dataConcl": "13/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-124", "project": "STLFLIX", "type": "Task", "summary": "Revisar configuração do chatwoot + n8n do Lucas", "assignee": null, "reporter": "Pedro Henrique A. Cruz", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "06/05/2026 14:47:18", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-123", "project": "STLFLIX", "type": "Story", "summary": "Atualizar Ordenação de Filtros categorias [ HOME ]", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "FLIX-142", "created": "06/05/2026 10:18:35", "dataInicio": "12/05/2026", "dataConcl": "21/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-121", "project": "STLFLIX", "type": "Bug", "summary": "CLONE - Cobrança indevida no cartão após mês grátis no STLFLIX", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "29/04/2026 08:33:15", "dataInicio": "29/04/2026", "dataConcl": "29/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-120", "project": "STLFLIX", "type": "Story", "summary": "Retirar modelo da busca na Flix", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": null, "created": "27/04/2026 11:06:00", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-118", "project": "STLFLIX", "type": "Incidentes", "summary": "Assinatura ativa não sincroniza com backend [FLIX] [STRIPE]", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "24/04/2026 10:16:25", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-117", "project": "STLFLIX", "type": "Story", "summary": "Liberação do PGAdmin para o Lucas", "assignee": "Pedro Henrique A. Cruz", "reporter": "Marcelo Augusto", "developer": "Pedro Henrique A. Cruz", "tester": "Pedro Henrique A. Cruz", "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "21/04/2026 15:39:57", "dataInicio": "07/05/2026", "dataConcl": "13/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-90", "project": "STLFLIX", "type": "Story", "summary": "Links da plataforma - FLIX", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "15/04/2026 09:58:11", "dataInicio": "30/04/2026", "dataConcl": "05/05/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-89", "project": "STLFLIX", "type": "Bug", "summary": "Créditos de filamentos não recebidos há três meses", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/04/2026 13:24:07", "dataInicio": null, "dataConcl": "15/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-88", "project": "STLFLIX", "type": "Bug", "summary": "Problema com acesso e benefícios na plataforma STLFLIX após troca de plano", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "13/04/2026 09:39:20", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-87", "project": "STLFLIX", "type": "Bug", "summary": "Problema com exibição dos cupons de desconto na conta do cliente", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": null, "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "13/04/2026 09:03:40", "dataInicio": null, "dataConcl": "15/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-85", "project": "STLFLIX", "type": "Story", "summary": "Atualização lógica e visualização dos bônus das impressoras", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": null, "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "14/04/2026 16:39:53", "dataInicio": "15/04/2026", "dataConcl": "06/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-84", "project": "STLFLIX", "type": "Story", "summary": "Adicionar informação do que foi comprado ao Asaas no campo \"descrição\"", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": null, "parent": null, "created": "14/04/2026 16:23:35", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-76", "project": "STLFLIX", "type": "Task", "summary": "Crédito não creditado na conta do cliente", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "02/04/2026 11:16:57", "dataInicio": null, "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-75", "project": "STLFLIX", "type": "Story", "summary": "Atualização de Best Sellers", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "07/04/2026 14:19:16", "dataInicio": "29/04/2026", "dataConcl": "05/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-74", "project": "STLFLIX", "type": "Task", "summary": "Desconto de filamento mensal não aplicado na plataforma", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "02/04/2026 10:44:12", "dataInicio": null, "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-73", "project": "STLFLIX", "type": "Task", "summary": "[ASAAS] Verificar Integração do ASAAS para criações de contas no FLIX e AI", "assignee": "Andre Bisewski", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "07/04/2026 11:20:35", "dataInicio": null, "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-72", "project": "STLFLIX", "type": "Task", "summary": "Desconto de assinatura em filamentos não aplicado este mês", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": null, "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "06/04/2026 11:33:25", "dataInicio": null, "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-71", "project": "STLFLIX", "type": "Task", "summary": "[Solicitações] Clone – Desconto de filamento mensal não aplicado na plataforma", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "07/04/2026 10:50:34", "dataInicio": "08/04/2026", "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-70", "project": "STLFLIX", "type": "Task", "summary": "[Solicitações] Clone – Desconto de assinatura em filamentos não aplicado este mês", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "07/04/2026 10:50:15", "dataInicio": "08/04/2026", "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-69", "project": "STLFLIX", "type": "Task", "summary": "[Solicitações] Clone – Crédito não creditado na conta do cliente", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "07/04/2026 10:49:34", "dataInicio": "08/04/2026", "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-68", "project": "STLFLIX", "type": "Story", "summary": "Nova Macro Categoria - Useful & Design", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "FLIX-142", "created": "07/04/2026 10:44:02", "dataInicio": "29/04/2026", "dataConcl": "06/05/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-67", "project": "STLFLIX", "type": "Incidentes", "summary": "[Solicitações] Clone – Erro na instalação de scripts após instabilidade no site", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "07/04/2026 10:30:30", "dataInicio": "07/04/2026", "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-66", "project": "STLFLIX", "type": "Incidentes", "summary": "Vulnerabilidade Lojas (.com e .com.br)", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "06/04/2026 17:37:14", "dataInicio": "06/04/2026", "dataConcl": "22/04/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-62", "project": "STLFLIX", "type": "Bug", "summary": "Verificar duplicidade de contas", "assignee": null, "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "06/04/2026 13:23:41", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-58", "project": "STLFLIX", "type": "Bug", "summary": "Modelos não aparecem como adquiridos após compra de 300 STLcoins", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "01/04/2026 10:18:28", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-57", "project": "STLFLIX", "type": "Story", "summary": "Integração dos novos campos de tradução", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": null, "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "FLIX-3", "created": "01/04/2026 12:26:39", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-56", "project": "STLFLIX", "type": "Story", "summary": "Gerar 5k cupons para polymaker e fazer mini tutorial", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "31/03/2026 09:53:07", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-54", "project": "STLFLIX", "type": "Story", "summary": "Marca D'água no arquivo STL Flix", "assignee": "Pedro Henrique A. Cruz", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": null, "parent": null, "created": "30/03/2026 14:01:52", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-52", "project": "STLFLIX", "type": "Story", "summary": "[LP] Configuração lp.stlflix.com.br", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "26/03/2026 18:24:13", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-51", "project": "STLFLIX", "type": "Task", "summary": "Estudo de usuários BOTs", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "25/03/2026 14:11:28", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-50", "project": "STLFLIX", "type": "Bug", "summary": "Checkout global dando Bad Gateway em alguns contextos", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "24/03/2026 12:39:58", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "FLIX-49", "project": "STLFLIX", "type": "Incidentes", "summary": "Status do pedido não atualiza após pagamento via PIX", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "24/03/2026 10:37:47", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-48", "project": "STLFLIX", "type": "Story", "summary": "Criação (Duplicar do get) o ambiente wordpress e subdominio: lp.stlflix.com.br", "assignee": "Pedro Henrique A. Cruz", "reporter": "João Gonzalez", "developer": "Pedro Henrique A. Cruz", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "23/03/2026 13:26:43", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "FLIX-46", "project": "STLFLIX", "type": "Task", "summary": "Input de dados demográficos e telefone tabela up_users", "assignee": "Andre Bisewski", "reporter": "Rene Antonio", "developer": null, "tester": null, "status": "Pronto P/ DEV", "stage": "Pronta pra dev", "tipo": "Sustentação", "parent": null, "created": "23/03/2026 11:48:10", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-45", "project": "STLFLIX", "type": "Bug", "summary": "[STLAI] Erro ao redirecionar usuário do STLFlix para STL AI sem assinatura ativa", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "19/03/2026 10:18:18", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "FLIX-44", "project": "STLFLIX", "type": "Story", "summary": "Exportar/Solicitar tradução/Subir atualização dos campos das categorias/tags/macro categories  que precisam ser traduzidos", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "FLIX-3", "created": "18/03/2026 10:50:27", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-43", "project": "STLFLIX", "type": "Story", "summary": "Salvar preferencia de idioma no perfil do usuário", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "FLIX-3", "created": "18/03/2026 10:26:24", "dataInicio": "14/04/2026", "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-42", "project": "STLFLIX", "type": "Story", "summary": "Adicionar no menu possibilidade de alterar idioma", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "FLIX-3", "created": "18/03/2026 10:26:11", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-41", "project": "STLFLIX", "type": "Story", "summary": "Rever lógica de redirect para idioma conforme localização do usuário", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": null, "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "FLIX-3", "created": "18/03/2026 10:25:37", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-40", "project": "STLFLIX", "type": "Story", "summary": "Exportar/Traduzir/Subir atualização dos campos que precisam ser traduzidos", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "FLIX-3", "created": "18/03/2026 10:24:48", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-39", "project": "STLFLIX", "type": "Story", "summary": "Criar campos no backend para campos em pt-br", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": null, "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "FLIX-3", "created": "18/03/2026 10:23:58", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-38", "project": "STLFLIX", "type": "Story", "summary": "Traduzir todas strings hardcoded", "assignee": "Andre Bisewski", "reporter": "Andre Bisewski", "developer": null, "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "FLIX-3", "created": "18/03/2026 10:23:06", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-37", "project": "STLFLIX", "type": "Bug", "summary": "[STLFLIX] Loading duplicando ao adicionar produto a Store", "assignee": null, "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "17/03/2026 17:19:08", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Low"}, {"key": "FLIX-33", "project": "STLFLIX", "type": "Bug", "summary": "[Checkout] Possível lentidão", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "16/03/2026 10:47:05", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-30", "project": "STLFLIX", "type": "Bug", "summary": "STLFLIX HOM- Ambiente de Homologação com Roleta sem tempo de Giro", "assignee": null, "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "12/03/2026 14:29:43", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-29", "project": "STLFLIX", "type": "Bug", "summary": "[STLFLIX] SSO STLAI > FLIX | FLIX > AI  não funciona", "assignee": null, "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "12/03/2026 14:28:16", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-28", "project": "STLFLIX", "type": "Bug", "summary": "[STLFLIX] Ícone desalinhado/sobreposto na barra de menu", "assignee": null, "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "12/03/2026 14:23:52", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-27", "project": "STLFLIX", "type": "Bug", "summary": "[STLFLIX] Falha ao carregar Drops (Voltou)", "assignee": "Andre Bisewski", "reporter": "Caroline Araújo da Silva", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "12/03/2026 14:23:02", "dataInicio": "15/04/2026", "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-26", "project": "STLFLIX", "type": "Bug", "summary": "Instabilidade ao finalizar compra", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "12/03/2026 10:46:28", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "FLIX-22", "project": "STLFLIX", "type": "Story", "summary": "[STLFLIX] Revisão dos recursos associados às lojas na AWS", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": "15/04/2026", "dataConcl": "15/04/2026", "intercom": false, "epic": false, "priority": "normal"}, {"key": "FLIX-21", "project": "STLFLIX", "type": "Story", "summary": "[STLFLIX] Integração Asaas", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "normal"}, {"key": "FLIX-20", "project": "STLFLIX", "type": "Story", "summary": "[STLFLIX] Implementar lógica de redirect por produto", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "FLIX-3", "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "FLIX-19", "project": "STLFLIX", "type": "Story", "summary": "[STLFLIX] Evento Amplitude Community Ideas", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "silvana souza", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "normal"}, {"key": "FLIX-18", "project": "STLFLIX", "type": "Story", "summary": "[STLFLIX] Migração da loja .com.br para Fabweb", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "normal"}, {"key": "FLIX-17", "project": "STLFLIX", "type": "Story", "summary": "[STLFLIX] Alterar o fluxo dos modelos Sign generator e Family magnets para quando o usuário fechar o customizador, voltar para a pg do customizador em si. Como os outros customizadores fazem.", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "FLIX-16", "project": "STLFLIX", "type": "Bug", "summary": "[STLFLIX] Ajustar bug scroll (up/down) no carrocel do TOP 20 da plataforma", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": "16/04/2026", "intercom": false, "epic": false, "priority": "High"}, {"key": "FLIX-15", "project": "STLFLIX", "type": "Story", "summary": "[Checkout] Mentoria AC-3D - Acelerador 3D STLflix", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "normal"}, {"key": "FLIX-14", "project": "STLFLIX", "type": "Story", "summary": "[STLFLIX] Algoritmo de trending  Community Ideas", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "normal"}, {"key": "FLIX-12", "project": "STLFLIX", "type": "Story", "summary": "[STLFLIX] Status da assinatura", "assignee": null, "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": null, "created": "10/03/2026 15:11:27", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Low"}, {"key": "BACK-49", "project": "Backoffice", "type": "Story", "summary": "Pendências GetDemo", "assignee": "Michel Angelo", "reporter": "João Crescioni", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "10/07/2026 13:59:32", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-48", "project": "Backoffice", "type": "Story", "summary": "Criação do Brandbook Ecossistema STLFLIX", "assignee": "João Crescioni", "reporter": "Michel Angelo", "developer": "João Crescioni", "tester": null, "status": "Em design", "stage": "Em design", "tipo": "Melhoria", "parent": "FLIX-305", "created": "19/05/2026 11:20:15", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-47", "project": "Backoffice", "type": "Story", "summary": "[LPs] Redesign Geral das Páginas de Assinatura - Ecossistema STLFLIX", "assignee": "Michel Angelo", "reporter": "Michel Angelo", "developer": "Michel Angelo", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "23/06/2026 09:18:35", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-44", "project": "Backoffice", "type": "Story", "summary": "Cancelar assinatura Seller", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "BACK-35", "created": "29/07/2026 21:21:05", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-43", "project": "Backoffice", "type": "Story", "summary": "[Seller] Backoffice", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Pronta p/ teste", "stage": "Em dev", "tipo": "Melhoria", "parent": "BACK-35", "created": "23/07/2026 16:57:32", "dataInicio": "24/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-42", "project": "Backoffice", "type": "Story", "summary": "Visualizar uso e saldo de créditos do STLSeller, incluindo Geração de anúncio (Core/Premium) e Postagem do anúncio", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "BACK-35", "created": "23/07/2026 16:57:01", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-41", "project": "Backoffice", "type": "Story", "summary": "Visualizar histórico de planos e assinaturas do STLSeller da conta", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "BACK-35", "created": "23/07/2026 16:56:47", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-40", "project": "Backoffice", "type": "Story", "summary": "Gerar senha temporária de login para o seller", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "BACK-35", "created": "23/07/2026 16:56:36", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-39", "project": "Backoffice", "type": "Story", "summary": "Editar o e-mail cadastrado na conta", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "BACK-35", "created": "23/07/2026 16:56:27", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-38", "project": "Backoffice", "type": "Story", "summary": "Visualizar dados básicos da conta", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "BACK-35", "created": "23/07/2026 16:56:19", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-37", "project": "Backoffice", "type": "Story", "summary": "Buscar uma conta por nome, e-mail ou ID", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "BACK-35", "created": "23/07/2026 16:55:58", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-34", "project": "Backoffice", "type": "Task", "summary": "Erro de integração entre Hotmart > Woo Commerce > plano no backend", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "17/07/2026 14:47:53", "dataInicio": "31/07/2026", "dataConcl": "31/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-33", "project": "Backoffice", "type": "Task", "summary": "Usuário adquiriu a assinatura, o valor foi pago e registrado no woo commerce, mas isso não gerou um acesso no backend da STLFLIX", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "16/07/2026 14:36:49", "dataInicio": "22/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-32", "project": "Backoffice", "type": "Bug", "summary": "[INTERCOM] Erro no Woo Commerce impede a criação de usuário no backend da FLIX", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Pronto P/ Deploy", "stage": "Em dev", "tipo": "Sustentação", "parent": null, "created": "16/07/2026 11:06:05", "dataInicio": "21/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "Medium"}, {"key": "BACK-31", "project": "Backoffice", "type": "Task", "summary": "Unificação de contas e problema com acesso ao plano 4 anos STLFLIX", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "16/07/2026 10:21:45", "dataInicio": "03/08/2026", "dataConcl": "03/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-30", "project": "Backoffice", "type": "Task", "summary": "Adicionar Drops na categoria feira", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "13/07/2026 17:28:38", "dataInicio": "15/07/2026", "dataConcl": "22/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-29", "project": "Backoffice", "type": "Task", "summary": "Adicionar Drops na categoria Best Seller", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "13/07/2026 17:31:25", "dataInicio": "15/07/2026", "dataConcl": "22/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-28", "project": "Backoffice", "type": "Story", "summary": "Adicionar Drops à Categoria no Backoffice", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "13/07/2026 17:27:46", "dataInicio": "17/07/2026", "dataConcl": "24/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-27", "project": "Backoffice", "type": "Task", "summary": "Estudo de e-mails enviados pelas plataformas do ecossistema STLFlix", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "13/07/2026 14:55:15", "dataInicio": "23/07/2026", "dataConcl": "23/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-25", "project": "Backoffice", "type": "Story", "summary": "[Drop] Video_thumbnail em português por idioma no menu", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "Jonas Tolentino", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": "Inovação", "parent": null, "created": "01/07/2026 16:12:04", "dataInicio": "16/07/2026", "dataConcl": "21/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-24", "project": "Backoffice", "type": "Story", "summary": "[Produto] Thumbnail em multi idioma no produto", "assignee": "Jonas Tolentino", "reporter": "João Gonzalez", "developer": "Jonas Tolentino", "tester": "Andre Bisewski", "status": "Code Review", "stage": "Em dev", "tipo": "Melhoria", "parent": null, "created": "01/07/2026 16:08:50", "dataInicio": "15/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-21", "project": "Backoffice", "type": "Task", "summary": "Atualização de JS de ativação", "assignee": "Andre Bisewski", "reporter": "Ray Lima", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "19/05/2026 16:06:33", "dataInicio": "21/05/2026", "dataConcl": "01/06/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "BACK-20", "project": "Backoffice", "type": "Task", "summary": "Links da plataforma", "assignee": "Andre Bisewski", "reporter": "Ray Lima", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "11/05/2026 11:44:28", "dataInicio": "19/05/2026", "dataConcl": "20/05/2026", "intercom": false, "epic": false, "priority": "Highest"}, {"key": "BACK-19", "project": "Backoffice", "type": "Task", "summary": "Liberar acesso ao backoffice", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "13/04/2026 14:36:57", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-18", "project": "Backoffice", "type": "Task", "summary": "[Melhoria] Limite de acesso admin no Backend do Flix", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "09/04/2026 14:36:22", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-17", "project": "Backoffice", "type": "Task", "summary": "[Solicitações] Clone – [ASAAS] Verificar Integração do ASAAS para criações de contas no FLIX e AI", "assignee": "João Gonzalez", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "07/04/2026 14:01:23", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-12", "project": "Backoffice", "type": "Bug", "summary": "[BACK-STLFLIX] Duplicidade de Contas no Painel STLFLIX", "assignee": "Caroline Araújo da Silva", "reporter": "Caroline Araújo da Silva", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": "Sustentação", "parent": null, "created": "06/04/2026 13:19:43", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-10", "project": "Backoffice", "type": "Task", "summary": "Atualização de links de afiliado – Substituição de colaborador", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "25/03/2026 11:31:15", "dataInicio": null, "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "normal"}, {"key": "BACK-7", "project": "Backoffice", "type": "Story", "summary": "Aterar padrão de data - PT-BR", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Marcelo Augusto", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "BACK-2", "created": "16/03/2026 16:15:34", "dataInicio": "09/04/2026", "dataConcl": "21/04/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-5", "project": "Backoffice", "type": "Story", "summary": "Criar botões BambuLab separados por tipo de impressão", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": "BACK-2", "created": "16/03/2026 16:09:52", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "BACK-3", "project": "Backoffice", "type": "Story", "summary": "Suportar upload de arquivos grandes no backend - acima de 1.4 GB", "assignee": "Marcelo Augusto", "reporter": "João Gonzalez", "developer": "João Gonzalez", "tester": "Marcelo Augusto", "status": "Done", "stage": "Concluído", "tipo": null, "parent": "BACK-2", "created": "16/03/2026 16:03:07", "dataInicio": null, "dataConcl": "18/03/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-47", "project": "STL Academy", "type": "Story", "summary": "Transferencia de acessos", "assignee": "Andre Bisewski", "reporter": "Alison Oliveira Santos Costa", "developer": "Andre Bisewski", "tester": null, "status": "Pronta p/ teste", "stage": "Em dev", "tipo": "Sustentação", "parent": null, "created": "06/08/2026 15:23:33", "dataInicio": "06/08/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-46", "project": "STL Academy", "type": "Task", "summary": "Formulário do STL Academy cria conversas no Intercom sem vínculo com o usuário", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": "Sustentação", "parent": null, "created": "05/08/2026 15:30:53", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-44", "project": "STL Academy", "type": "Task", "summary": "[ACADEMY] Criação do Checklist | ENG", "assignee": "Michel Angelo", "reporter": "João Crescioni", "developer": null, "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "BACK-45", "created": "22/06/2026 14:53:54", "dataInicio": null, "dataConcl": "06/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-43", "project": "STL Academy", "type": "Story", "summary": "[Academy] Checklist academy | PT BR", "assignee": "Michel Angelo", "reporter": "João Gonzalez", "developer": "João Crescioni", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": "BACK-45", "created": "18/06/2026 10:57:35", "dataInicio": null, "dataConcl": "06/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-42", "project": "STL Academy", "type": "Story", "summary": "Redesign Estratégico Cursos e STLACADEMY", "assignee": "João Crescioni", "reporter": "Michel Angelo", "developer": "Michel Angelo", "tester": null, "status": "Em design", "stage": "Em design", "tipo": "Inovação", "parent": "FLIX-305", "created": "16/07/2026 13:25:10", "dataInicio": "16/07/2026", "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-41", "project": "STL Academy", "type": "Bug", "summary": "[Header] Problemas de navegação no header da STL Academy", "assignee": "Andre Bisewski", "reporter": "João Gonzalez", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "BACK-51", "created": "04/08/2026 10:21:08", "dataInicio": "04/08/2026", "dataConcl": "06/08/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-40", "project": "STL Academy", "type": "Bug", "summary": "[Intercom] Vivendo de Impressão 3D não aparecendo", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": "Sustentação", "parent": null, "created": "29/07/2026 15:27:04", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "High"}, {"key": "ACADEMY-37", "project": "STL Academy", "type": "Task", "summary": "Formulário do STL Academy cria conversas no Intercom sem vínculo com o usuário", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": "Melhoria", "parent": null, "created": "27/07/2026 10:56:58", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-36", "project": "STL Academy", "type": "Task", "summary": "Formulário do STL Academy cria conversas no Intercom sem vínculo com o usuário", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": "Sustentação", "parent": null, "created": "27/07/2026 10:56:08", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-35", "project": "STL Academy", "type": "Task", "summary": "Formulário do STL Academy cria conversas no Intercom sem vínculo com o usuário", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": "Melhoria", "parent": null, "created": "27/07/2026 10:55:11", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-34", "project": "STL Academy", "type": "Story", "summary": "Criação de ambiente de aulas ao vivo (aniversário)", "assignee": "Alison Oliveira Santos Costa", "reporter": "Alison Oliveira Santos Costa", "developer": null, "tester": null, "status": "Backlog", "stage": "Backlog", "tipo": null, "parent": null, "created": "27/07/2026 10:49:14", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "High"}, {"key": "ACADEMY-33", "project": "STL Academy", "type": "Story", "summary": "[Academy] Nova Header STLAcademy", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": null, "parent": "BACK-51", "created": "27/07/2026 09:22:41", "dataInicio": null, "dataConcl": null, "intercom": false, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-32", "project": "STL Academy", "type": "Task", "summary": "Formulário do STL Academy cria conversas no Intercom sem vínculo com o usuário", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": "Sustentação", "parent": null, "created": "23/07/2026 15:57:06", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-31", "project": "STL Academy", "type": "Task", "summary": "Formulário do STL Academy cria conversas no Intercom sem vínculo com o usuário", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Em análise", "stage": "Em produto", "tipo": "Sustentação", "parent": null, "created": "22/07/2026 13:57:13", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-30", "project": "STL Academy", "type": "Task", "summary": "Aula duplicada na STLACADEMY", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "22/07/2026 11:39:55", "dataInicio": "22/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-29", "project": "STL Academy", "type": "Task", "summary": "Formulário do STL Academy cria conversas no Intercom sem vínculo com o usuário", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Aguardado suporte", "stage": "Análise técnica", "tipo": "Sustentação", "parent": null, "created": "21/07/2026 11:05:41", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-24", "project": "STL Academy", "type": "Story", "summary": "[Intercom] Campo E-mail no academy", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": null, "parent": null, "created": "20/07/2026 10:13:00", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "ACADEMY-23", "project": "STL Academy", "type": "Task", "summary": "[Intercom] Campo E-mail no academy", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": "Sustentação", "parent": null, "created": "20/07/2026 10:12:19", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "ACADEMY-22", "project": "STL Academy", "type": "Task", "summary": "[Intercom] Campo E-mail no academy", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": "Sustentação", "parent": null, "created": "20/07/2026 10:11:02", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "ACADEMY-21", "project": "STL Academy", "type": "Task", "summary": "[Intercom] Campo E-mail no academy", "assignee": "João Gonzalez", "reporter": "João Gonzalez", "developer": null, "tester": null, "status": "Refinamento de negócio", "stage": "Em produto", "tipo": "Sustentação", "parent": null, "created": "20/07/2026 10:09:39", "dataInicio": null, "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "ACADEMY-20", "project": "STL Academy", "type": "Task", "summary": "[Intercom] Cursos não liberados após upgrade de plano aniversário", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": null, "created": "10/07/2026 19:25:44", "dataInicio": "15/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "normal"}, {"key": "ACADEMY-19", "project": "STL Academy", "type": "Story", "summary": "[Intercom] Problema ao acessar vídeos dos cursos no PC", "assignee": "Caroline Araújo da Silva", "reporter": "João Gonzalez", "developer": "Caroline Araújo da Silva", "tester": null, "status": "Done", "stage": "Concluído", "tipo": null, "parent": null, "created": "09/07/2026 14:29:55", "dataInicio": "10/07/2026", "dataConcl": null, "intercom": true, "epic": false, "priority": "High"}, {"key": "ACADEMY-18", "project": "STL Academy", "type": "Task", "summary": "URLs para GetDemo | STLACADEMY", "assignee": "Caroline Araújo da Silva", "reporter": "João Crescioni", "developer": "Caroline Araújo da Silva", "tester": "Caroline Araújo da Silva", "status": "Done", "stage": "Concluído", "tipo": "Sustentação", "parent": "BACK-46", "created": "30/06/2026 19:03:56", "dataInicio": "03/07/2026", "dataConcl": "03/07/2026", "intercom": false, "epic": false, "priority": "Medium"}, {"key": "ACADEMY-17", "project": "STL Academy", "type": "Story", "summary": "[ACADEMY] Ajuste redirecionamento de Compra dos Cursos", "assignee": "Andre Bisewski", "reporter": "Caroline Araújo da Silva", "developer": "Andre Bisewski", "tester": "Andre Bisewski", "status": "Done", "stage": "Concluído", "tipo": "Melhoria", "parent": null, "created": "17/06/2026 14:24:52", "dataInicio": "18/06/2026", "dataConcl": "19/06/2026", "intercom": false, "epic": false, "priority": "High"}];

const STAGES = ["Backlog", "Em design", "Em produto", "Análise técnica", "Pronta pra dev", "Em dev", "Em rollout", "Concluído"];
const TASK_STAGES = STAGES.filter((s) => s !== "Em rollout");
const EPIC_COLUMNS = ["Backlog", "Produto", "Em refinamento Técnico", "Pronto P/ DEV", "Em DEV", "Em rollout", "Done"];
const PRODUCTS = ["STLFLIX", "STL IA", "STL Seller", "STL Loja", "Backoffice", "STL Academy"];
const LAYERS = ["Inovação", "Melhoria", "Sustentação", "Sem classificação"];
const ACTIVE_STAGES = ["Em design", "Em produto", "Análise técnica", "Pronta pra dev", "Em dev", "Em rollout"];
const NOW_DATE = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

/* =====================================================================
   TOKENS — Design Tokens STLFLIX v5.3, modo dark e modo light
   ===================================================================== */

const TOKENS = {
  dark: {
    T: { bg0: "#090a0a", bg1: "#15191d", bg2: "#1c2126", border1: "#15191d", border2: "#272c31", borderStrong: "#75797d", ink0: "#fafafa", ink1: "#929699", ink2: "#5c6166", cardShadow: "none" },
    PRODUCT_STYLE: {
      "STLFLIX":    { primary: "#5166e6", subtle: "rgba(81,102,230,0.14)",  text: "#b8d3ff" },
      "STL IA":     { primary: "#ad54ff", subtle: "rgba(173,84,255,0.14)", text: "#edb4ff" },
      "STL Seller": { primary: "#00955a", subtle: "rgba(0,149,90,0.16)",   text: "#98d4af" },
      "STL Academy":{ primary: "#f54300", subtle: "rgba(245,67,0,0.14)",   text: "#ffab84" },
      "STL Loja":   { primary: "#e5484d", subtle: "rgba(229,72,77,0.16)", text: "#ffb4b6" },
      "Backoffice": { primary: "#8b8b8d", subtle: "rgba(139,139,141,0.14)",text: "#c7c7c9" },
    },
    TIPO_STYLE: {
      "Inovação":          { dot: "#8ea9f4", text: "#c3d1fb", subtle: "rgba(142,169,244,0.14)" },
      "Melhoria":          { dot: "#82d9a8", text: "#bdeed3", subtle: "rgba(130,217,168,0.14)" },
      "Sustentação":       { dot: "#f29999", text: "#fbcaca", subtle: "rgba(242,153,153,0.14)" },
      "Sem classificação": { dot: "#b3b3b8", text: "#d6d6d9", subtle: "rgba(179,179,184,0.12)" },
    },
    stageBarColor: "#5166e6", stageDoneColor: "#00aa6c", highlightColor: "#fc2d37", neutralBarColor: "#75797d",
    lineCreated: "#5166e6", lineDone: "#00aa6c",
    reporterColor: "#ff6d82", devColor: "#5166e6", testerColor: "#00aa6c",
    insightBg: "rgba(81,102,230,0.08)", insightBorder: "rgba(81,102,230,0.25)", insightText: "#dbe2ff",
  },
  light: {
    T: { bg0: "#fefefe", bg1: "#f4f4f4", bg2: "#e8e8e8", border1: "#f0f0ee", border2: "#e2e1dc", borderStrong: "#b9b9bb", ink0: "#0e0e0f", ink1: "#5d5d60", ink2: "#8b8b8d", cardShadow: "0 1px 2px rgba(14,17,20,0.05)" },
    PRODUCT_STYLE: {
      "STLFLIX":    { primary: "#5166e6", subtle: "rgba(81,102,230,0.10)",  text: "#3d4ad4" },
      "STL IA":     { primary: "#ad54ff", subtle: "rgba(173,84,255,0.10)", text: "#9536e7" },
      "STL Seller": { primary: "#00955a", subtle: "rgba(0,149,90,0.12)",   text: "#00955a" },
      "STL Academy":{ primary: "#f54300", subtle: "rgba(245,67,0,0.10)",   text: "#d71e00" },
      "STL Loja":   { primary: "#e5484d", subtle: "rgba(229,72,77,0.12)", text: "#c5282d" },
      "Backoffice": { primary: "#8b8b8d", subtle: "rgba(139,139,141,0.12)",text: "#5d5d60" },
    },
    TIPO_STYLE: {
      "Inovação":          { dot: "#8ea9f4", text: "#4256c4", subtle: "rgba(142,169,244,0.14)" },
      "Melhoria":          { dot: "#5fbf8c", text: "#2f8f5f", subtle: "rgba(95,191,140,0.14)" },
      "Sustentação":       { dot: "#e08585", text: "#c14848", subtle: "rgba(224,133,133,0.12)" },
      "Sem classificação": { dot: "#a8a8ac", text: "#6b6b70", subtle: "rgba(168,168,172,0.12)" },
    },
    stageBarColor: "#5166e6", stageDoneColor: "#009155", highlightColor: "#de001b", neutralBarColor: "#b9b9bb",
    lineCreated: "#5166e6", lineDone: "#009155",
    reporterColor: "#d94f75", devColor: "#5166e6", testerColor: "#009155",
    insightBg: "rgba(81,102,230,0.06)", insightBorder: "rgba(81,102,230,0.22)", insightText: "#2d35b3",
  },
};

const ThemeCtx = createContext(null);
function useTheme() { return useContext(ThemeCtx); }

/* =====================================================================
   DADOS — contexto com epics/tasks ao vivo + sincronização com o Sheets
   ===================================================================== */

const SHEET_ID = "1HteBrBkY4XCkmXGMTJIuA2EXAraZsDKw_xjZu0xoUgw";
const SHEET_GID = "0";
// URL do deployment do Apps Script (termina em /exec). Veja apps-script/sync.gs.js.
// Fica em .env.local (fora do git) porque dá acesso de leitura à planilha pra quem tiver o link.
const SHEET_SYNC_URL = import.meta.env.VITE_SHEET_SYNC_URL || "";
const DATA_OVERRIDE_KEY = "jira-data-override-v1";

const STAGE_MAP_JS = {
  "Backlog": "Backlog", "Candidato Próximo Trimestre": "Backlog",
  "Em design": "Em design", "Design ready": "Em design",
  "Refinamento de negócio": "Em produto", "Em análise": "Em produto", "Handoff": "Em produto",
  "Em refinamento Técnico": "Análise técnica", "Aguardado suporte": "Análise técnica",
  "Pronto P/ DEV": "Pronta pra dev", "Fila da Sprint": "Pronta pra dev", "Fila da sprint UX": "Pronta pra dev",
  "Em DEV": "Em dev", "Code Review": "Em dev", "Em testes": "Em dev", "Pronto P/ Deploy": "Em dev", "Pronta p/ teste": "Em dev",
  "Em rollout": "Em rollout", "Done": "Concluído",
};
const EXCLUDE_STATUS_JS = new Set(["Cancelado", "Arquivado"]);
const EXCLUDE_PROJECTS_JS = new Set(["Infra", "Dados"]);

// Normaliza pra "DD/MM/AAAA HH:MM:SS" — o Apps Script pode mandar a data já
// formatada ou, se a conversão de Date lá dentro falhar, como ISO UTC
// ("2026-08-07T18:06:01.000Z"); aqui aceitamos os dois formatos.
function normalizeDateStr(v) {
  const s = (v == null ? "" : String(v)).trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function transformSheetRow(r) {
  const proj = (r["Project"] || "").trim();
  const status = (r["Status"] || "").trim();
  if (EXCLUDE_PROJECTS_JS.has(proj) || EXCLUDE_STATUS_JS.has(status) || !r["Key"]) return null;
  const issueType = (r["Issue Type"] || "").trim();
  const isEpic = issueType === "Epic";
  const stage = STAGE_MAP_JS[status] || null;
  const summary = (r["Summary"] || "").trim();
  return {
    key: r["Key"].trim(), project: proj, type: issueType,
    summary,
    assignee: (r["Assignee"] || "").trim() || null,
    reporter: (r["Reporter"] || "").trim() || null,
    developer: (r["Desenvolvedor"] || "").trim() || null,
    tester: (r["Quem testou"] || "").trim() || null,
    status, stage,
    tipo: (r["Tipo de entrega"] || "").trim() || null,
    created: normalizeDateStr(r["Created"]),
    dataInicio: normalizeDateStr(r["Data de início "] || r["Data de início"]),
    dataConcl: normalizeDateStr(r["Data Concluído"]),
    intercom: summary.includes("[Intercom]"),
    epic: isEpic,
    priority: (r["Priority"] || "").trim() || null,
  };
}

const DataCtx = createContext(null);
function useData() { return useContext(DataCtx); }

function DataProvider({ children }) {
  const { canWriteShared, canCreateCard, ownsCard, user } = useAuth();
  const [epics, setEpics] = useState(EPICS_SEED_INITIAL);
  const [tasks, setTasks] = useState(TASKS_SEED_INITIAL);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | loading | error

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(DATA_OVERRIDE_KEY, true);
        if (res && res.value) {
          const saved = JSON.parse(res.value);
          if (saved.epics) setEpics(saved.epics);
          if (saved.tasks) setTasks(saved.tasks);
          if (saved.syncedAt) setLastSync(saved.syncedAt);
        }
      } catch (e) {}
    })();
  }, []);

  // Estado de agendamento do Roadmap (posições no Gantt, fila, épicos
  // criados à mão) mora aqui, não em RoadmapScreen, porque o drawer de épico
  // é o mesmo em Projetos e Roadmap — as duas telas precisam ler e escrever
  // o mesmo estado pra abrir/editar o card der onde vier.
  const [positions, setPositions] = useState({});
  const [customEpics, setCustomEpics] = useState([]);
  const [prioOrder, setPrioOrder] = useState([]);
  const [filaOrder, setFilaOrder] = useState([]);
  const [roadmapSaving, setRoadmapSaving] = useState(false);

  useEffect(() => {
    (async () => {
      let savedPositions = {};
      let savedCustom = [];
      let savedPrioOrder = [];
      let savedFilaOrder = [];
      try {
        const res = await storage.get(ROADMAP_STORAGE_KEY, true);
        if (res && res.value) {
          const saved = JSON.parse(res.value);
          savedPositions = saved.positions || {};
          savedCustom = saved.customEpics || [];
          savedPrioOrder = saved.prioOrder || [];
          savedFilaOrder = saved.filaOrder || [];
        }
      } catch (e) {}
      setPrioOrder(savedPrioOrder);
      setFilaOrder(savedFilaOrder);

      let projetosStatus = {};
      try {
        const res2 = await storage.get("fila-projetos-order-v2", true);
        if (res2 && res2.value) {
          const saved2 = JSON.parse(res2.value);
          projetosStatus = saved2.status || {};
        }
      } catch (e) {}

      setCustomEpics(savedCustom);
      setPositions((prev) => {
        const next = { ...prev, ...savedPositions };
        let changed = false;
        epics.forEach((ep) => {
          if (Object.prototype.hasOwnProperty.call(savedPositions, ep.key)) return; // respeita escolha manual, mesmo remoção explícita
          const status = projetosStatus[ep.key] || ep.status;
          if (status === "Pronto P/ DEV") {
            next[ep.key] = { roadmapLane: ep.project, startWeek: 0, durationWeeks: 2 };
            changed = true;
          }
        });
        if (changed) persistRoadmap(next, savedCustom, savedPrioOrder, savedFilaOrder);
        return next;
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epics]);

  const persistRoadmap = useCallback(async (nextPositions, nextCustom, nextPrioOrder, nextFilaOrder) => {
    setRoadmapSaving(true);
    try { await storage.set(ROADMAP_STORAGE_KEY, JSON.stringify({ positions: nextPositions, customEpics: nextCustom, prioOrder: nextPrioOrder, filaOrder: nextFilaOrder }), true); } catch (e) {}
    setRoadmapSaving(false);
  }, []);

  const allEpicsWithCustom = useMemo(() => [...epics, ...customEpics], [epics, customEpics]);
  const byKeyWithCustom = useMemo(() => Object.fromEntries(allEpicsWithCustom.map((e) => [e.key, e])), [allEpicsWithCustom]);

  // Choke point de toda mudança de posição (drop no Gantt, resize, remover,
  // "Gantt", e o Salvar do drawer para épico da planilha): um único gate cobre
  // todos, então nenhum caminho novo passa por fora sem alguém notar.
  const updatePosition = useCallback((key, patch) => {
    if (!ownsCard(byKeyWithCustom[key])) return;
    setPositions((prev) => {
      const next = { ...prev, [key]: { ...(prev[key] || { roadmapLane: null, startWeek: null, durationWeeks: 2 }), ...patch } };
      persistRoadmap(next, customEpics, prioOrder, filaOrder);
      return next;
    });
  }, [persistRoadmap, customEpics, prioOrder, filaOrder, ownsCard, byKeyWithCustom]);

  const addEpic = useCallback(() => {
    if (!canCreateCard) return null;
    const key = `NOVO-${Date.now().toString().slice(-6)}`;
    // `createdBy` é o dono do card: é ele que faz `ownsCard` distinguir "meu card"
    // de "card de outro" — e um épico da planilha, que nunca passa por aqui, não
    // tem dono nenhum e por isso é só do super.
    const novo = { key, project: null, summary: "Novo épico", assignee: null, reporter: null, status: "Rascunho", tipo: null, created: null, priority: null, epic: true, createdBy: user ? user.email : null };
    const nextCustom = [...customEpics, novo];
    setCustomEpics(nextCustom);
    setPositions((prev) => { const next = { ...prev, [key]: { roadmapLane: null, startWeek: null, durationWeeks: 2 } }; persistRoadmap(next, nextCustom, prioOrder, filaOrder); return next; });
    return key;
  }, [canCreateCard, user, customEpics, prioOrder, filaOrder, persistRoadmap]);

  const deleteEpic = useCallback((key) => {
    if (!ownsCard(byKeyWithCustom[key])) return;
    const nextCustom = customEpics.filter((e) => e.key !== key);
    setCustomEpics(nextCustom);
    setPositions((prev) => { const next = { ...prev }; delete next[key]; persistRoadmap(next, nextCustom, prioOrder, filaOrder); return next; });
  }, [ownsCard, byKeyWithCustom, customEpics, prioOrder, filaOrder, persistRoadmap]);

  const saveDrawer = useCallback((key, patch) => {
    if (!ownsCard(byKeyWithCustom[key])) return;
    if (key.startsWith("NOVO-")) {
      const nextCustom = customEpics.map((e) => (e.key === key ? { ...e, summary: patch.summary } : e));
      setCustomEpics(nextCustom);
      setPositions((prev) => { const next = { ...prev, [key]: { roadmapLane: patch.roadmapLane, startWeek: patch.startWeek, durationWeeks: patch.durationWeeks } }; persistRoadmap(next, nextCustom, prioOrder, filaOrder); return next; });
    } else {
      updatePosition(key, { roadmapLane: patch.roadmapLane, startWeek: patch.startWeek, durationWeeks: patch.durationWeeks });
    }
  }, [ownsCard, byKeyWithCustom, customEpics, prioOrder, filaOrder, persistRoadmap, updatePosition]);

  // Janela fixa de semanas pra popular o seletor "Semana inicial" do drawer
  // fora do Roadmap (Projetos não tem Gantt, então não tem zoom pra derivar isso).
  const ROADMAP_PAST_WEEKS = 4;
  const roadmapWeeks = useMemo(() => {
    const weekCount = 13;
    const start = addDays(startOfWeek(NOW_DATE), -ROADMAP_PAST_WEEKS * 7);
    return Array.from({ length: weekCount + ROADMAP_PAST_WEEKS }, (_, i) => ({ index: i - ROADMAP_PAST_WEEKS, start: addDays(start, i * 7) }));
  }, []);

  const syncFromSheet = useCallback(async () => {
    // O botão já é só do super; o gate aqui é o que vale — a função vive no
    // contexto e qualquer tela nova poderia chamá-la.
    if (!canWriteShared) return { ok: false, reason: "forbidden" };
    if (!SHEET_SYNC_URL) {
      setSyncStatus("error");
      return { ok: false, reason: "no-url" };
    }
    setSyncStatus("loading");
    try {
      const res = await fetch(SHEET_SYNC_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      const transformed = rows.map(transformSheetRow).filter(Boolean);
      const nextEpics = transformed.filter((r) => r.epic);
      const nextTasks = transformed.filter((r) => !r.epic);
      const syncedAt = new Date().toISOString();
      setEpics(nextEpics);
      setTasks(nextTasks);
      setLastSync(syncedAt);
      setSyncStatus("idle");
      try { await storage.set(DATA_OVERRIDE_KEY, JSON.stringify({ epics: nextEpics, tasks: nextTasks, syncedAt }), true); } catch (e) {}
      return { ok: true };
    } catch (e) {
      setSyncStatus("error");
      return { ok: false, reason: e.message };
    }
  }, [canWriteShared]);

  const value = useMemo(() => ({
    epics, tasks, setEpics, setTasks, syncFromSheet, lastSync, syncStatus,
    positions, setPositions, customEpics, setCustomEpics, prioOrder, setPrioOrder, filaOrder, setFilaOrder,
    roadmapSaving, persistRoadmap, updatePosition, addEpic, deleteEpic, saveDrawer, roadmapWeeks,
  }), [
    epics, tasks, syncFromSheet, lastSync, syncStatus,
    positions, customEpics, prioOrder, filaOrder,
    roadmapSaving, persistRoadmap, updatePosition, addEpic, deleteEpic, saveDrawer, roadmapWeeks,
  ]);
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

function layerOf(t) { return t.tipo || "Sem classificação"; }
function epicLabel(epics, parentKey) {
  if (!parentKey) return null;
  const epic = epics.find((e) => e.key === parentKey);
  return epic ? epic.summary : parentKey;
}
function initials(name) {
  if (!name) return "—";
  const p = name.trim().split(/\s+/);
  return (p[0]?.[0] || "") + (p[1]?.[0] || "");
}
function parseBRDate(str) {
  if (!str) return null;
  const datePart = str.trim().split(" ")[0];
  const [d, m, y] = datePart.split("/");
  if (!d || !m || !y) return null;
  return new Date(`${y}-${m}-${d}T00:00:00`);
}
function daysBetween(a, b) { if (!a || !b) return null; return Math.round((b - a) / 86400000); }
function monthKey(d) { return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : null; }

function Badge({ children, bg, color }) {
  return (
    <span style={{ background: bg, color, borderRadius: 8, padding: "2px 7px", fontSize: 11, fontWeight: 500, fontFamily: "'Inter Tight', sans-serif" }} className="inline-flex items-center gap-1 whitespace-nowrap">
      {children}
    </span>
  );
}

/* =====================================================================
   PROJETOS — fila única de épicos
   ===================================================================== */

function EpicCard({ epic, isFirst, isLast, onUp, onDown, onDragStart, onDragOverCard, onDropOnCard, dropIndicator, onOpen, readOnly }) {
  const { T, PRODUCT_STYLE, TIPO_STYLE } = useTheme();
  const prod = PRODUCT_STYLE[epic.project] || PRODUCT_STYLE["Backoffice"];
  const tipo = TIPO_STYLE[epic.tipo];
  return (
    <div draggable={!readOnly} onDragStart={(e) => onDragStart(e, epic.key)} onDragOver={(e) => onDragOverCard(e, epic.key)} onDrop={(e) => onDropOnCard(e, epic.key)} style={{ position: "relative" }}>
      {dropIndicator === "before" && <div style={{ position: "absolute", top: -5, left: 0, right: 0, height: 2, borderRadius: 2, background: prod.primary }} />}
      <div onClick={() => onOpen(epic)} className="pp-card" style={{ background: T.bg1, border: `1px solid ${T.border2}`, borderRadius: 12, padding: 10, cursor: readOnly ? "pointer" : "grab", boxShadow: T.cardShadow }}>
        <div className="flex items-start justify-between" style={{ gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>{epic.key}</span>
          <Badge bg={prod.subtle} color={prod.text}>{epic.project}</Badge>
        </div>
        <p style={{ marginTop: 6, fontSize: 13, lineHeight: 1.35, color: T.ink0, fontFamily: "'Inter Tight', sans-serif", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {epic.summary || "(sem título)"}
        </p>
        <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
          <span>
            {epic.tipo && tipo && (
              <span className="inline-flex items-center" style={{ gap: 5, fontSize: 11, color: tipo.text, fontFamily: "'Inter Tight', sans-serif" }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: tipo.dot, display: "inline-block" }} />{epic.tipo}
              </span>
            )}
          </span>
          <div className="flex items-center" style={{ gap: 6 }}>
            {!readOnly && (
              <>
                <button onClick={(e) => { e.stopPropagation(); onUp(epic.key); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 6, border: "none", background: "transparent", color: isFirst ? T.border2 : T.ink1, cursor: isFirst ? "default" : "pointer" }}><ChevronUp size={13} /></button>
                <button onClick={(e) => { e.stopPropagation(); onDown(epic.key); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 6, border: "none", background: "transparent", color: isLast ? T.border2 : T.ink1, cursor: isLast ? "default" : "pointer" }}><ChevronDown size={13} /></button>
              </>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 999, background: T.bg2, color: T.ink0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", border: `1px solid ${T.border2}`, fontFamily: "'Inter Tight', sans-serif" }}>
              {initials(epic.assignee || epic.reporter)}
            </div>
          </div>
        </div>
      </div>
      {dropIndicator === "after" && <div style={{ position: "absolute", bottom: -5, left: 0, right: 0, height: 2, borderRadius: 2, background: prod.primary }} />}
    </div>
  );
}

/**
 * `canEdit` só importa na seção de agendamento, que é a única que escreve — e
 * que só o Roadmap monta (`schedulable`). Em Projetos o drawer já é leitura para
 * todo mundo, então o aviso de "card de outro" não aparece lá.
 */
function EpicDrawer({ epic, onClose, weeks, onSave, onDelete, canEdit }) {
  const { T, PRODUCT_STYLE } = useTheme();
  const schedulable = !!(weeks && onSave);
  const [summary, setSummary] = useState(epic?.summary || "");
  const [lane, setLane] = useState(epic?.roadmapLane || PRIORIZACAO_KEY);
  const [startWeek, setStartWeek] = useState(epic?.startWeek ?? 0);
  const [duration, setDuration] = useState(epic?.durationWeeks ?? 2);
  useEffect(() => { setSummary(epic?.summary || ""); setLane(epic?.roadmapLane || PRIORIZACAO_KEY); setStartWeek(epic?.startWeek ?? 0); setDuration(epic?.durationWeeks ?? 2); }, [epic]);
  if (!epic) return null;
  const prod = PRODUCT_STYLE[epic.project] || PRODUCT_STYLE["Backoffice"];
  const isCustom = schedulable && epic.key.startsWith("NOVO-");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end", background: "rgba(0,0,0,0.45)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ height: "100%", width: 360, overflowY: "auto", borderLeft: `1px solid ${T.border2}`, background: T.bg0, padding: 20 }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12, fontWeight: 500, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>{epic.key}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.ink1, cursor: "pointer" }}><X size={16} /></button>
        </div>

        {isCustom ? (
          <input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Nome do épico" disabled={!canEdit}
            style={{ marginTop: 10, width: "100%", background: T.bg1, border: `1px solid ${T.border2}`, borderRadius: 8, padding: "8px 10px", fontSize: 15, fontWeight: 600, color: T.ink0, fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
        ) : (
          <h3 style={{ marginTop: 8, fontSize: 17, fontWeight: 700, color: T.ink0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{epic.summary}</h3>
        )}

        {!isCustom && (
          <>
            {epic.resumo && (
              <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.45, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>{epic.resumo}</p>
            )}
            <div className="flex flex-wrap" style={{ gap: 6, marginTop: 10 }}>
              <Badge bg={prod.subtle} color={prod.text}>{epic.project}</Badge>
              {epic.tipo && <Badge bg={T.bg2} color={T.ink1}>{epic.tipo}</Badge>}
              {epic.priority && <Badge bg={T.bg2} color={T.ink2}>{epic.priority}</Badge>}
            </div>
            <dl style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5, fontFamily: "'Inter Tight', sans-serif" }}>
              {[
                ["Responsável", epic.assignee],
                ["Relator", epic.reporter],
                ["Desenvolvedor", epic.developer],
                ["Testador", epic.tester],
                ["Status (Jira)", epic.status],
                ["Criado em", epic.created],
                ["Data de início", epic.dataInicio],
                ["Data de conclusão", epic.dataConcl],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between"><dt style={{ color: T.ink1 }}>{k}</dt><dd style={{ color: T.ink0 }}>{v || "—"}</dd></div>
              ))}
            </dl>
          </>
        )}

        {schedulable && (
          <>
            <p style={{ marginTop: 20, marginBottom: 6, fontSize: 12, fontWeight: 500, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>Camada</p>
            <select value={lane} onChange={(e) => setLane(e.target.value)} disabled={!canEdit} style={{ width: "100%", borderRadius: 8, border: `1px solid ${T.border2}`, background: T.bg1, color: T.ink0, fontSize: 13, padding: "7px 8px", fontFamily: "'Inter Tight', sans-serif" }}>
              <option value={PRIORIZACAO_KEY}>Para priorização</option>
              {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

            {lane !== PRIORIZACAO_KEY && (
              <>
                <p style={{ marginTop: 16, marginBottom: 6, fontSize: 12, fontWeight: 500, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>Semana inicial</p>
                <select value={startWeek} onChange={(e) => setStartWeek(Number(e.target.value))} disabled={!canEdit} style={{ width: "100%", borderRadius: 8, border: `1px solid ${T.border2}`, background: T.bg1, color: T.ink0, fontSize: 13, padding: "7px 8px", fontFamily: "'Inter Tight', sans-serif" }}>
                  {weeks.map((w) => <option key={w.index} value={w.index}>Semana de {fmtWeek(w.start)}</option>)}
                </select>

                <p style={{ marginTop: 16, marginBottom: 6, fontSize: 12, fontWeight: 500, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>Duração (semanas)</p>
                <div className="flex items-center" style={{ gap: 8 }}>
                  {canEdit && <button onClick={() => setDuration((d) => Math.max(1, d - 1))} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 6, border: `1px solid ${T.border2}`, background: T.bg1, color: T.ink0, cursor: "pointer" }}><Minus size={12} /></button>}
                  <span style={{ fontSize: 13, color: T.ink0, fontFamily: "'Inter Tight', sans-serif", minWidth: 20, textAlign: "center" }}>{duration}</span>
                  {canEdit && <button onClick={() => setDuration((d) => Math.min(12, d + 1))} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 6, border: `1px solid ${T.border2}`, background: T.bg1, color: T.ink0, cursor: "pointer" }}><Plus size={12} /></button>}
                </div>
              </>
            )}

            {canEdit ? (
              <div className="flex items-center justify-between" style={{ marginTop: 24 }}>
                {isCustom ? (
                  <button onClick={() => onDelete(epic.key)} style={{ fontSize: 12, color: "#e08585", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter Tight', sans-serif" }}>Excluir</button>
                ) : <span />}
                <button
                  onClick={() => onSave(epic.key, { summary: isCustom ? summary : epic.summary, roadmapLane: lane === PRIORIZACAO_KEY ? null : lane, startWeek: lane === PRIORIZACAO_KEY ? null : startWeek, durationWeeks: duration })}
                  style={{ borderRadius: 8, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, border: "none", cursor: "pointer", background: "#5166e6", color: "#fff", fontFamily: "'Inter Tight', sans-serif" }}
                >
                  Salvar
                </button>
              </div>
            ) : (
              <p className="inline-flex items-center" style={{ marginTop: 24, gap: 6, fontSize: 11.5, color: T.ink2, fontFamily: "'Inter Tight', sans-serif" }}>
                <Lock size={11} /> Somente leitura: este card não é seu.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProjetosScreen() {
  const { T, PRODUCT_STYLE } = useTheme();
  const { epics: EPICS_SEED, positions, roadmapWeeks, saveDrawer, deleteEpic } = useData();
  // A fila de épicos é de todos: reordenar ou mudar de coluna aqui muda o board
  // que o time lê. Só o superusuário escreve (o admin escreve nos cards dele, no
  // Roadmap).
  const { canWriteShared, ownsCard } = useAuth();
  const STORAGE_KEY = "fila-projetos-order-v2";
  const [order, setOrder] = useState(EPICS_SEED.map((e) => e.key));
  const [statusOf, setStatusOf] = useState(() => Object.fromEntries(EPICS_SEED.map((e) => [e.key, e.status])));
  const [productFilter, setProductFilter] = useState("Todos");
  const [openKey, setOpenKey] = useState(null);
  const [dragKey, setDragKey] = useState(null);
  const [dropInfo, setDropInfo] = useState(null);
  const [saving, setSaving] = useState(false);

  const byKey = useMemo(() => Object.fromEntries(EPICS_SEED.map((e) => [e.key, e])), [EPICS_SEED]);
  const openEpic = useMemo(() => {
    if (!openKey) return null;
    const base = byKey[openKey];
    if (!base) return null;
    return { ...base, ...(positions[openKey] || { roadmapLane: null, startWeek: null, durationWeeks: 2 }) };
  }, [openKey, byKey, positions]);

  // reconcilia order/statusOf sempre que os dados vindos do contexto mudarem (ex: após "Sincronizar dados")
  useEffect(() => {
    setOrder((prev) => {
      const validPrev = prev.filter((k) => byKey[k]);
      const newKeys = EPICS_SEED.map((e) => e.key).filter((k) => !validPrev.includes(k));
      return [...validPrev, ...newKeys];
    });
    setStatusOf((prev) => {
      const next = {};
      EPICS_SEED.forEach((e) => { next[e.key] = prev[e.key] || e.status; });
      return next;
    });
  }, [EPICS_SEED, byKey]);

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY, true);
        if (res && res.value) {
          const saved = JSON.parse(res.value);
          if (saved.order) setOrder((prev) => [...saved.order.filter((k) => byKey[k]), ...prev.filter((k) => !saved.order.includes(k))]);
          if (saved.status) setStatusOf((prev) => ({ ...prev, ...saved.status }));
        }
      } catch (e) {}
    })();
  }, [byKey]);

  const persist = useCallback(async (nextOrder, nextStatus) => {
    setSaving(true);
    try { await storage.set(STORAGE_KEY, JSON.stringify({ order: nextOrder, status: nextStatus }), true); } catch (e) {}
    setSaving(false);
  }, []);

  const visibleOrder = useMemo(() => (productFilter === "Todos" ? order : order.filter((k) => byKey[k].project === productFilter)), [order, productFilter, byKey]);

  const columnKeys = useMemo(() => {
    const map = {};
    EPIC_COLUMNS.forEach((c) => (map[c] = []));
    visibleOrder.forEach((k) => { const s = statusOf[k]; if (map[s]) map[s].push(k); });
    return map;
  }, [visibleOrder, statusOf]);

  const moveWithinColumn = useCallback((key, dir) => {
    if (!canWriteShared) return;
    setOrder((prev) => {
      const col = statusOf[key];
      const sameColKeys = prev.filter((k) => statusOf[k] === col);
      const idxInCol = sameColKeys.indexOf(key);
      const swapWith = sameColKeys[idxInCol + dir];
      if (!swapWith) return prev;
      const a = prev.indexOf(key), b = prev.indexOf(swapWith);
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      persist(next, statusOf);
      return next;
    });
  }, [statusOf, persist, canWriteShared]);

  const onDragStart = (e, key) => { setDragKey(key); e.dataTransfer.effectAllowed = "move"; };
  const onDragOverCard = (e, overKey) => {
    e.preventDefault();
    if (overKey === dragKey) { setDropInfo(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setDropInfo({ key: overKey, position: e.clientY - rect.top < rect.height / 2 ? "before" : "after" });
  };
  const onDropOnCard = (e, overKey) => {
    e.preventDefault();
    if (!canWriteShared) { setDragKey(null); setDropInfo(null); return; }
    if (!dragKey || dragKey === overKey) { setDragKey(null); setDropInfo(null); return; }
    setOrder((prev) => {
      const next = prev.filter((k) => k !== dragKey);
      let insertAt = next.indexOf(overKey);
      if (dropInfo?.position === "after") insertAt += 1;
      next.splice(insertAt, 0, dragKey);
      const newStatus = { ...statusOf, [dragKey]: statusOf[overKey] };
      setStatusOf(newStatus);
      persist(next, newStatus);
      return next;
    });
    setDragKey(null); setDropInfo(null);
  };
  const onDropOnColumn = (e, column) => {
    e.preventDefault();
    if (!dragKey || !canWriteShared) return;
    setOrder((prev) => {
      const next = prev.filter((k) => k !== dragKey);
      next.push(dragKey);
      const newStatus = { ...statusOf, [dragKey]: column };
      setStatusOf(newStatus);
      persist(next, newStatus);
      return next;
    });
    setDragKey(null); setDropInfo(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
      <div style={{ borderBottom: `1px solid ${T.border1}`, padding: "16px 24px" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: T.ink0 }}>Projetos</h1>
            <p style={{ fontSize: 12, color: T.ink1, marginTop: 2 }}>
              {canWriteShared
                ? "Épicos em uma fila única — arraste entre status, use as setas pra priorizar dentro da coluna"
                : "Épicos em uma fila única — somente leitura"}
            </p>
          </div>
          {saving && <span style={{ fontSize: 11, color: T.ink2 }}>salvando…</span>}
        </div>
        <div className="flex" style={{ gap: 6, marginTop: 12 }}>
          {["Todos", "STLFLIX", "STL IA", "STL Seller", "STL Loja", "Backoffice"].map((p) => {
            const active = productFilter === p;
            const style = PRODUCT_STYLE[p];
            return (
              <button key={p} onClick={() => setProductFilter(p)} style={{ borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", background: active ? (style ? style.subtle : T.bg2) : "transparent", color: active ? (style ? style.text : T.ink0) : T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pp-scroll flex" style={{ gap: 16, overflowX: "auto", padding: "20px 24px", flex: 1 }}>
        {EPIC_COLUMNS.map((col) => (
          <div key={col} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDropOnColumn(e, col)} style={{ width: 250, flexShrink: 0, display: "flex", flexDirection: "column" }}>
            <div className="flex items-center justify-between" style={{ padding: "0 4px 8px" }}>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>{col}</span>
              <span style={{ borderRadius: 6, background: T.bg1, padding: "1px 6px", fontSize: 11, fontWeight: 500, color: T.ink1 }}>{columnKeys[col].length}</span>
            </div>
            <div style={{ minHeight: 60, display: "flex", flexDirection: "column", gap: 8, borderRadius: 12, padding: 4 }}>
              {columnKeys[col].map((key, i) => (
                <EpicCard key={key} epic={byKey[key]} isFirst={i === 0} isLast={i === columnKeys[col].length - 1}
                  onUp={() => moveWithinColumn(key, -1)} onDown={() => moveWithinColumn(key, 1)}
                  onDragStart={onDragStart} onDragOverCard={onDragOverCard} onDropOnCard={onDropOnCard}
                  dropIndicator={dropInfo?.key === key ? dropInfo.position : null} onOpen={(e) => setOpenKey(e.key)}
                  readOnly={!canWriteShared} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <EpicDrawer
        epic={openEpic} weeks={roadmapWeeks} onClose={() => setOpenKey(null)}
        onSave={(key, patch) => { saveDrawer(key, patch); setOpenKey(null); }}
        onDelete={(key) => { deleteEpic(key); setOpenKey(null); }}
        canEdit={ownsCard(openEpic)}
      />
    </div>
  );
}

/* =====================================================================
   TAREFAS — quadro único, com filtros por produto/pessoa/tipo de entrega
   ===================================================================== */

function TaskCard({ task, isFirst, isLast, onUp, onDown, onDragStart, onDragOverCard, onDropOnCard, dropIndicator, onOpen, readOnly }) {
  const { T, PRODUCT_STYLE, TIPO_STYLE } = useTheme();
  const { epics } = useData();
  const prod = PRODUCT_STYLE[task.project] || PRODUCT_STYLE["Backoffice"];
  const layer = TIPO_STYLE[layerOf(task)];
  const epic = epicLabel(epics, task.parent);
  return (
    <div draggable={!readOnly} onDragStart={(e) => onDragStart(e, task.key)} onDragOver={(e) => onDragOverCard(e, task.key)} onDrop={(e) => onDropOnCard(e, task.key)} style={{ position: "relative" }}>
      {dropIndicator === "before" && <div style={{ position: "absolute", top: -5, left: 0, right: 0, height: 2, borderRadius: 2, background: prod.primary }} />}
      <div onClick={() => onOpen(task)} className="pp-card" style={{ background: T.bg1, border: `1px solid ${T.border2}`, borderRadius: 12, padding: 10, cursor: readOnly ? "pointer" : "grab", boxShadow: T.cardShadow }}>
        <div className="flex items-start justify-between" style={{ gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>{task.key}</span>
          <div className="flex items-center" style={{ gap: 4 }}>
            {task.intercom && <Badge bg={PRODUCT_STYLE["STLFLIX"].subtle} color={PRODUCT_STYLE["STLFLIX"].text}>Intercom</Badge>}
            <Badge bg={prod.subtle} color={prod.text}>{task.project}</Badge>
          </div>
        </div>
        <p style={{ marginTop: 6, fontSize: 13, lineHeight: 1.35, color: T.ink0, fontFamily: "'Inter Tight', sans-serif", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {task.summary || "(sem título)"}
        </p>
        {epic && (
          <p style={{ marginTop: 3, fontSize: 10.5, color: T.ink2, fontFamily: "'Inter Tight', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            ⌂ {epic}
          </p>
        )}
        <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
          <span className="inline-flex items-center" style={{ gap: 5, fontSize: 11, color: layer.text, fontFamily: "'Inter Tight', sans-serif" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: layer.dot, display: "inline-block" }} />{layerOf(task)}
          </span>
          <div className="flex items-center" style={{ gap: 6 }}>
            {!readOnly && (
              <>
                <button onClick={(e) => { e.stopPropagation(); onUp(task.key); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 6, border: "none", background: "transparent", color: isFirst ? T.border2 : T.ink1, cursor: isFirst ? "default" : "pointer" }}><ChevronUp size={13} /></button>
                <button onClick={(e) => { e.stopPropagation(); onDown(task.key); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 6, border: "none", background: "transparent", color: isLast ? T.border2 : T.ink1, cursor: isLast ? "default" : "pointer" }}><ChevronDown size={13} /></button>
              </>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 999, background: T.bg2, color: T.ink0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", border: `1px solid ${T.border2}`, fontFamily: "'Inter Tight', sans-serif" }}>
              {initials(task.assignee)}
            </div>
          </div>
        </div>
      </div>
      {dropIndicator === "after" && <div style={{ position: "absolute", bottom: -5, left: 0, right: 0, height: 2, borderRadius: 2, background: prod.primary }} />}
    </div>
  );
}

function StageColumn({ stage, tasks, onDropOnColumn, onDragStart, onDragOverCard, onDropOnCard, dropInfo, onOpen, moveWithinColumn, readOnly }) {
  const { T } = useTheme();
  const [isOver, setIsOver] = useState(false);
  const scopeKeys = tasks.map((t) => t.key);
  return (
    <div onDragOver={(e) => { e.preventDefault(); setIsOver(true); }} onDragLeave={() => setIsOver(false)} onDrop={(e) => { setIsOver(false); onDropOnColumn(e, stage); }} style={{ width: 234, flexShrink: 0, display: "flex", flexDirection: "column", borderRadius: 12, background: isOver ? T.bg1 : "transparent" }}>
      <div className="flex items-center justify-between" style={{ padding: "0 6px 8px" }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>{stage}</span>
        <span style={{ borderRadius: 6, background: T.bg1, padding: "1px 6px", fontSize: 11, fontWeight: 500, color: T.ink1 }}>{tasks.length}</span>
      </div>
      <div style={{ minHeight: 40, display: "flex", flexDirection: "column", gap: 8, padding: "0 2px 8px" }}>
        {tasks.map((t, i) => (
          <TaskCard
            key={t.key} task={t} isFirst={i === 0} isLast={i === tasks.length - 1}
            onUp={() => moveWithinColumn(t.key, -1, scopeKeys)} onDown={() => moveWithinColumn(t.key, 1, scopeKeys)}
            onDragStart={onDragStart} onDragOverCard={onDragOverCard} onDropOnCard={onDropOnCard}
            dropIndicator={dropInfo?.key === t.key ? dropInfo.position : null} onOpen={onOpen}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

function TaskDrawer({ task, onClose, onMove, canWrite }) {
  const { T, PRODUCT_STYLE, TIPO_STYLE } = useTheme();
  if (!task) return null;
  const prod = PRODUCT_STYLE[task.project] || PRODUCT_STYLE["Backoffice"];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end", background: "rgba(0,0,0,0.45)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ height: "100%", width: 380, overflowY: "auto", borderLeft: `1px solid ${T.border2}`, background: T.bg0, padding: 20 }}>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12, fontWeight: 500, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>{task.key} · {task.type}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.ink1, cursor: "pointer" }}><X size={16} /></button>
        </div>
        <h3 style={{ marginTop: 8, fontSize: 17, fontWeight: 700, color: T.ink0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{task.summary}</h3>
        <div className="flex flex-wrap" style={{ gap: 6, marginTop: 14 }}>
          <Badge bg={prod.subtle} color={prod.text}>{task.project}</Badge>
          <Badge bg={TIPO_STYLE[layerOf(task)].subtle} color={TIPO_STYLE[layerOf(task)].text}>{layerOf(task)}</Badge>
          {task.intercom && <Badge bg={PRODUCT_STYLE["STLFLIX"].subtle} color={PRODUCT_STYLE["STLFLIX"].text}>Intercom</Badge>}
          {task.priority && <Badge bg={T.bg2} color={T.ink2}>{task.priority}</Badge>}
        </div>
        <dl style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, fontFamily: "'Inter Tight', sans-serif" }}>
          {[["Responsável", task.assignee], ["Relator", task.reporter], ["Status (Jira)", task.status], ["Criado em", task.created], ["Data de início", task.dataInicio], ["Concluído em", task.dataConcl]].map(([k, v]) => (
            <div key={k} className="flex justify-between"><dt style={{ color: T.ink1 }}>{k}</dt><dd style={{ color: T.ink0 }}>{v || "—"}</dd></div>
          ))}
        </dl>
        {canWrite && (
          <>
            <p style={{ marginTop: 20, marginBottom: 8, fontSize: 12, fontWeight: 500, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>Mover para etapa</p>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {TASK_STAGES.map((s) => (
                <button key={s} onClick={() => onMove(task.key, s)} style={{ borderRadius: 8, padding: "5px 8px", fontSize: 11.5, border: "none", cursor: "pointer", background: s === task.stage ? T.bg2 : T.bg1, color: s === task.stage ? T.ink0 : T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LaneHeader({ label, mode, count }) {
  const { T, TIPO_STYLE } = useTheme();
  const style = mode === "tipo" ? TIPO_STYLE[label] : null;
  return (
    <div className="flex items-center" style={{ gap: 8, padding: "2px 4px 4px" }}>
      {mode === "tipo" ? (
        <span style={{ width: 8, height: 8, borderRadius: 999, background: style.dot, display: "inline-block" }} />
      ) : (
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 999, background: T.bg2, fontSize: 9, fontWeight: 700, color: T.ink0, textTransform: "uppercase" }}>{initials(label)}</span>
      )}
      <span style={{ fontSize: 13.5, fontWeight: 600, color: T.ink0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</span>
      <span style={{ fontSize: 12, color: T.ink2, fontFamily: "'Inter Tight', sans-serif" }}>{count} {count === 1 ? "item" : "itens"}</span>
    </div>
  );
}

function TarefasScreen() {
  const { T, PRODUCT_STYLE } = useTheme();
  const { tasks: TASKS_SEED } = useData();
  // Quadro compartilhado: mover tarefa de etapa ou reordenar é escrita do super.
  const { canWriteShared } = useAuth();
  const STORAGE_KEY = "fila-tasks-v2";
  const [order, setOrder] = useState(TASKS_SEED.map((t) => t.key));
  const [stageOf, setStageOf] = useState(() => Object.fromEntries(TASKS_SEED.map((t) => [t.key, t.stage])));
  const [openTask, setOpenTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dragKey, setDragKey] = useState(null);
  const [dropInfo, setDropInfo] = useState(null);

  const [productFilter, setProductFilter] = useState(() => new Set(PRODUCTS));
  const [personFilter, setPersonFilter] = useState("all");
  const [tipoFilter, setTipoFilter] = useState("all");

  const byKey = useMemo(() => Object.fromEntries(TASKS_SEED.map((t) => [t.key, t])), [TASKS_SEED]);

  useEffect(() => {
    setOrder((prev) => {
      const validPrev = prev.filter((k) => byKey[k]);
      const newKeys = TASKS_SEED.map((t) => t.key).filter((k) => !validPrev.includes(k));
      return [...validPrev, ...newKeys];
    });
    setStageOf((prev) => {
      const next = {};
      TASKS_SEED.forEach((t) => { next[t.key] = prev[t.key] || t.stage; });
      return next;
    });
  }, [TASKS_SEED, byKey]);

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY, true);
        if (res && res.value) {
          const saved = JSON.parse(res.value);
          if (saved.order) setOrder((prev) => [...saved.order.filter((k) => byKey[k]), ...prev.filter((k) => !saved.order.includes(k))]);
          if (saved.stage) setStageOf((prev) => ({ ...prev, ...saved.stage }));
        }
      } catch (e) {}
    })();
  }, [byKey]);

  const persist = useCallback(async (nextOrder, nextStage) => {
    setSaving(true);
    try { await storage.set(STORAGE_KEY, JSON.stringify({ order: nextOrder, stage: nextStage }), true); } catch (e) {}
    setSaving(false);
  }, []);

  const people = useMemo(() => [...new Set(TASKS_SEED.filter((t) => t.assignee).map((t) => t.assignee))].sort(), []);

  const toggleProduct = (p) => setProductFilter((prev) => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n.size ? n : new Set(PRODUCTS); });
  const clearFilters = () => { setProductFilter(new Set(PRODUCTS)); setPersonFilter("all"); setTipoFilter("all"); };

  const visibleOrder = useMemo(() => {
    return order.filter((k) => {
      const t = byKey[k];
      if (!productFilter.has(t.project)) return false;
      if (personFilter !== "all" && t.assignee !== personFilter) return false;
      if (tipoFilter !== "all" && layerOf(t) !== tipoFilter) return false;
      return true;
    });
  }, [order, byKey, productFilter, personFilter, tipoFilter]);

  const [layerMode, setLayerMode] = useState("todos"); // "tipo" | "pessoa" | "todos"

  const moveWithinColumn = useCallback((key, dir, scopeKeys) => {
    if (!canWriteShared) return;
    setOrder((prev) => {
      const idxInScope = scopeKeys.indexOf(key);
      const swapWith = scopeKeys[idxInScope + dir];
      if (!swapWith) return prev;
      const a = prev.indexOf(key), b = prev.indexOf(swapWith);
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      persist(next, stageOf);
      return next;
    });
  }, [stageOf, persist, canWriteShared]);

  const moveTask = useCallback((key, stage) => {
    if (!canWriteShared) return;
    setStageOf((prev) => { const next = { ...prev, [key]: stage }; persist(order, next); return next; });
    setOpenTask((prev) => (prev && prev.key === key ? { ...prev, stage } : prev));
  }, [order, persist, canWriteShared]);

  const onDragStart = (e, key) => { setDragKey(key); e.dataTransfer.effectAllowed = "move"; };
  const onDragOverCard = (e, overKey) => {
    e.preventDefault();
    if (overKey === dragKey) { setDropInfo(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setDropInfo({ key: overKey, position: e.clientY - rect.top < rect.height / 2 ? "before" : "after" });
  };
  const onDropOnCard = (e, overKey) => {
    e.preventDefault();
    if (!canWriteShared) { setDragKey(null); setDropInfo(null); return; }
    if (!dragKey || dragKey === overKey) { setDragKey(null); setDropInfo(null); return; }
    setOrder((prev) => {
      const next = prev.filter((k) => k !== dragKey);
      let insertAt = next.indexOf(overKey);
      if (dropInfo?.position === "after") insertAt += 1;
      next.splice(insertAt, 0, dragKey);
      const newStage = { ...stageOf, [dragKey]: stageOf[overKey] };
      setStageOf(newStage);
      persist(next, newStage);
      return next;
    });
    setDragKey(null); setDropInfo(null);
  };
  const onDropOnColumn = (e, stage) => {
    e.preventDefault();
    if (!dragKey || !canWriteShared) return;
    setOrder((prev) => {
      const next = prev.filter((k) => k !== dragKey);
      next.push(dragKey);
      const newStage = { ...stageOf, [dragKey]: stage };
      setStageOf(newStage);
      persist(next, newStage);
      return next;
    });
    setDragKey(null); setDropInfo(null);
  };

  const groups = useMemo(() => {
    if (layerMode === "todos") return [{ key: null, keys: visibleOrder }];
    if (layerMode === "tipo") {
      return LAYERS.map((l) => ({ key: l, keys: visibleOrder.filter((k) => layerOf(byKey[k]) === l) })).filter((g) => g.keys.length > 0);
    }
    const m = new Map();
    visibleOrder.forEach((k) => {
      const p = byKey[k].assignee || "Sem responsável";
      if (!m.has(p)) m.set(p, []);
      m.get(p).push(k);
    });
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length).map(([key, keys]) => ({ key, keys }));
  }, [visibleOrder, byKey, layerMode]);

  const keysForStage = useCallback((keys, stage) => {
    const filtered = keys.filter((k) => stageOf[k] === stage);
    if (stage !== "Concluído") return filtered;
    return filtered.filter((k) => {
      const d = parseBRDate(byKey[k].dataConcl);
      if (!d) return false;
      return daysBetween(d, NOW_DATE) <= 30;
    });
  }, [stageOf, byKey]);

  const openTaskFull = openTask ? { ...openTask, stage: stageOf[openTask.key] } : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
      <div style={{ borderBottom: `1px solid ${T.border1}`, padding: "16px 24px" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: T.ink0 }}>Tarefas</h1>
            <p style={{ fontSize: 12, color: T.ink1, marginTop: 2 }}>{visibleOrder.length} de {order.length} itens</p>
          </div>
          <div className="flex items-center" style={{ gap: 10 }}>
            {saving && <span style={{ fontSize: 11, color: T.ink2 }}>salvando…</span>}
            <div style={{ display: "flex", background: T.bg1, borderRadius: 8, padding: 2 }}>
              {[["tipo", "Tipo de entrega"], ["pessoa", "Responsável"], ["todos", "Todos"]].map(([key, label]) => (
                <button key={key} onClick={() => setLayerMode(key)} style={{ borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", background: layerMode === key ? T.bg2 : "transparent", color: layerMode === key ? T.ink0 : T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center" style={{ gap: 8, marginTop: 12 }}>
          <FilterSelect T={T} value={personFilter} onChange={setPersonFilter} options={[{ value: "all", label: "Todos os responsáveis" }, ...people.map((p) => ({ value: p, label: p }))]} />
          <FilterSelect T={T} value={tipoFilter} onChange={setTipoFilter} options={[{ value: "all", label: "Todos os tipos de entrega" }, ...LAYERS.map((s) => ({ value: s, label: s }))]} />
          <button onClick={clearFilters} style={{ fontSize: 12, color: T.ink1, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "'Inter Tight', sans-serif" }}>Limpar filtros</button>
        </div>
        <div className="flex flex-wrap items-center" style={{ gap: 6, marginTop: 8 }}>
          <span style={{ fontSize: 11.5, color: T.ink2, fontFamily: "'Inter Tight', sans-serif", marginRight: 2 }}>Produtos:</span>
          {PRODUCTS.map((p) => {
            const active = productFilter.has(p);
            const style = PRODUCT_STYLE[p];
            return (
              <button key={p} onClick={() => toggleProduct(p)} style={{ borderRadius: 8, padding: "4px 9px", fontSize: 11.5, fontWeight: 500, border: `1px solid ${active ? "transparent" : T.border2}`, cursor: "pointer", background: active ? style.subtle : "transparent", color: active ? style.text : T.ink2, fontFamily: "'Inter Tight', sans-serif" }}>
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 22 }}>
        {groups.map((g) => (
          <div key={g.key ?? "flat"} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {g.key && <LaneHeader label={g.key} mode={layerMode} count={g.keys.length} />}
            <div className="pp-scroll flex" style={{ gap: 14, overflowX: "auto", paddingBottom: 4 }}>
              {TASK_STAGES.map((stage) => (
                <StageColumn
                  key={stage} stage={stage}
                  tasks={keysForStage(g.keys, stage).map((k) => ({ ...byKey[k], stage: stageOf[k] }))}
                  onDropOnColumn={onDropOnColumn} onDragStart={onDragStart} onDragOverCard={onDragOverCard} onDropOnCard={onDropOnCard}
                  dropInfo={dropInfo} onOpen={setOpenTask} moveWithinColumn={moveWithinColumn}
                  readOnly={!canWriteShared}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <TaskDrawer task={openTaskFull} onClose={() => setOpenTask(null)} onMove={moveTask} canWrite={canWriteShared} />
    </div>
  );
}

/* =====================================================================
   ANÁLISES — Visão Geral (org-wide, os 6 produtos Dev), com as 8 etapas
   ===================================================================== */

function AnaliseKpi({ label, value, tone }) {
  const { T } = useTheme();
  const tones = { neutral: T.ink0, amber: "#d17000", rose: "#fc2d37", emerald: "#00aa6c", sky: "#5166e6" };
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${T.border2}`, background: T.bg1, padding: 14, flex: 1, minWidth: 140, boxShadow: T.cardShadow }}>
      <p style={{ fontSize: 11.5, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>{label}</p>
      <p style={{ marginTop: 6, fontSize: 22, fontWeight: 700, color: tone ? tones[tone] : T.ink0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</p>
    </div>
  );
}

function SectionTitle({ title, sub }) {
  const { T } = useTheme();
  return (
    <div style={{ marginTop: 22, marginBottom: 8 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: T.ink0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</p>
      {sub && <p style={{ fontSize: 12, color: T.ink1, marginTop: 2, fontFamily: "'Inter Tight', sans-serif" }}>{sub}</p>}
    </div>
  );
}

const ISSUE_TYPES = ["Story", "Task", "Bug", "Incidentes", "Spike"];

function FilterSelect({ value, onChange, options, T }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        borderRadius: 8, border: `1px solid ${T.border2}`, background: T.bg1, color: T.ink0,
        fontSize: 12.5, fontFamily: "'Inter Tight', sans-serif", padding: "6px 8px", minWidth: 150, cursor: "pointer",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function AnaliseScreen() {
  const { T, PRODUCT_STYLE, TIPO_STYLE, theme, palette } = useTheme();
  const { tasks: TASKS_SEED } = useData();
  const rcAxis = { fill: T.ink1, fontSize: 11.5, fontFamily: "'Inter Tight', sans-serif" };
  const rcTooltip = { contentStyle: { background: T.bg1, border: `1px solid ${T.border2}`, borderRadius: 8, fontSize: 12, fontFamily: "'Inter Tight', sans-serif" }, labelStyle: { color: T.ink0 }, itemStyle: { color: T.ink0 } };

  const [period, setPeriod] = useState("all");
  const [etapa, setEtapa] = useState("all");
  const [issueType, setIssueType] = useState("all");
  const [origem, setOrigem] = useState("all");
  const [tipoEntrega, setTipoEntrega] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState(() => new Set(PRODUCTS));

  const toggleProduct = (p) => setSelectedProducts((prev) => {
    const n = new Set(prev);
    n.has(p) ? n.delete(p) : n.add(p);
    return n.size ? n : new Set(PRODUCTS); // nunca deixa vazio
  });
  const resetFilters = () => {
    setPeriod("all"); setEtapa("all"); setIssueType("all"); setOrigem("all"); setTipoEntrega("all");
    setSelectedProducts(new Set(PRODUCTS));
  };

  const tasks = useMemo(() => {
    return TASKS_SEED.filter((t) => {
      if (!selectedProducts.has(t.project)) return false;
      if (etapa !== "all" && t.stage !== etapa) return false;
      if (issueType !== "all" && t.type !== issueType) return false;
      if (origem === "yes" && !t.intercom) return false;
      if (origem === "no" && t.intercom) return false;
      if (tipoEntrega !== "all" && layerOf(t) !== tipoEntrega) return false;
      if (period !== "all") {
        const d = parseBRDate(t.created);
        if (!d) return false;
        if (period === "month" && monthKey(d) !== monthKey(NOW_DATE)) return false;
        if (period === "30" && daysBetween(d, NOW_DATE) > 30) return false;
        if (period === "90" && daysBetween(d, NOW_DATE) > 90) return false;
      }
      return true;
    });
  }, [period, etapa, issueType, origem, tipoEntrega, selectedProducts, TASKS_SEED]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const ativo = tasks.filter((t) => ACTIVE_STAGES.includes(t.stage));
    const done90 = tasks.filter((t) => {
      if (t.stage !== "Concluído") return false;
      const d = parseBRDate(t.dataConcl);
      if (!d) return false;
      return daysBetween(d, NOW_DATE) <= 90;
    }).length;
    const agingArr = ativo.map((t) => daysBetween(parseBRDate(t.created), NOW_DATE)).filter((v) => v !== null);
    const avgAging = agingArr.length ? Math.round(agingArr.reduce((a, b) => a + b, 0) / agingArr.length) : 0;
    const activeAssignees = new Set(ativo.filter((t) => t.assignee).map((t) => t.assignee)).size;

    const dtOrder = ["Inovação", "Melhoria", "Sustentação", "Sem classificação"];
    const allocation = PRODUCTS.map((p) => {
      const row = { project: p };
      dtOrder.forEach((dt) => { row[dt] = tasks.filter((t) => t.project === p && layerOf(t) === dt).length; });
      return row;
    });

    const stageDist = STAGES.map((s) => ({ stage: s, count: tasks.filter((t) => t.stage === s).length }));

    const wipCounts = {};
    ativo.forEach((t) => { if (t.assignee) wipCounts[t.assignee] = (wipCounts[t.assignee] || 0) + 1; });
    const wipEntries = Object.entries(wipCounts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, count]) => ({ name, count }));

    const byProjectAging = {};
    PRODUCTS.forEach((p) => {
      const arr = tasks.filter((t) => t.project === p && ACTIVE_STAGES.includes(t.stage)).map((t) => daysBetween(parseBRDate(t.created), NOW_DATE)).filter((v) => v !== null);
      if (arr.length) byProjectAging[p] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    });
    const agingEntries = Object.entries(byProjectAging).sort((a, b) => b[1] - a[1]).map(([project, days]) => ({ project, days }));

    const createdDates = tasks.map((t) => parseBRDate(t.created)).filter(Boolean);
    const doneDates = tasks.filter((t) => t.stage === "Concluído").map((t) => parseBRDate(t.dataConcl)).filter(Boolean);
    const months = [...new Set([...createdDates.map(monthKey), ...doneDates.map(monthKey)])].sort();
    const throughput = months.map((m) => ({
      month: m,
      Criadas: createdDates.filter((d) => monthKey(d) === m).length,
      Concluídas: doneDates.filter((d) => monthKey(d) === m).length,
    }));

    function topByField(field, n = 10) {
      const counts = {};
      tasks.forEach((t) => { const v = t[field]; if (v) counts[v] = (counts[v] || 0) + 1; });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }));
    }
    const topReporters = topByField("reporter");
    const topDevelopers = topByField("developer");
    const topTesters = topByField("tester");

    const support = tasks.filter((t) => t.intercom);
    const supportDone = support.filter((t) => t.stage === "Concluído").length;
    const totalDoneAll = tasks.filter((t) => t.stage === "Concluído").length;
    const supportPctDone = totalDoneAll ? Math.round((100 * supportDone) / totalDoneAll) : 0;
    const supportAtivo = support.filter((t) => ACTIVE_STAGES.includes(t.stage)).length;
    const supportBacklog = support.filter((t) => t.stage === "Backlog").length;
    const nonSupportTotal = total - support.length;
    const supportPct = nonSupportTotal ? Math.round((100 * support.length) / nonSupportTotal) : 0;
    const supportByProject = Object.entries(
      support.reduce((acc, t) => { acc[t.project] = (acc[t.project] || 0) + 1; return acc; }, {})
    ).sort((a, b) => b[1] - a[1]).map(([project, count]) => ({ project, count }));

    const topAssignee = wipEntries[0];
    const worstProject = agingEntries[0];

    return { total, ativoCount: ativo.length, done90, avgAging, activeAssignees, allocation, dtOrder, stageDist, wipEntries, agingEntries, throughput, topReporters, topDevelopers, topTesters, support, supportDone, supportPctDone, supportAtivo, supportBacklog, supportPct, supportByProject, topAssignee, worstProject };
  }, [tasks]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 40px" }}>
      <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: T.ink0 }}>Análises — Visão Geral</h1>
      <p style={{ fontSize: 12, color: T.ink1, marginTop: 2 }}>Os 6 produtos Dev juntos · exclui épicos, Cancelado/Arquivado e o projeto Dados</p>

      <div className="flex flex-wrap items-center" style={{ gap: 8, marginTop: 14 }}>
        <FilterSelect T={T} value={period} onChange={setPeriod} options={[
          { value: "all", label: "Todo o período" },
          { value: "month", label: "Mês atual" },
          { value: "30", label: "Últimos 30 dias" },
          { value: "90", label: "Últimos 90 dias" },
        ]} />
        <FilterSelect T={T} value={etapa} onChange={setEtapa} options={[{ value: "all", label: "Todas as etapas" }, ...STAGES.map((s) => ({ value: s, label: s }))]} />
        <FilterSelect T={T} value={issueType} onChange={setIssueType} options={[{ value: "all", label: "Todos os tipos" }, ...ISSUE_TYPES.map((s) => ({ value: s, label: s }))]} />
        <FilterSelect T={T} value={origem} onChange={setOrigem} options={[
          { value: "all", label: "Todas as origens" },
          { value: "yes", label: "Só veio do Intercom" },
          { value: "no", label: "Excluir Intercom" },
        ]} />
        <FilterSelect T={T} value={tipoEntrega} onChange={setTipoEntrega} options={[{ value: "all", label: "Todos os tipos de entrega" }, ...LAYERS.map((s) => ({ value: s, label: s }))]} />
        <button onClick={resetFilters} style={{ fontSize: 12, color: T.ink1, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "'Inter Tight', sans-serif" }}>Limpar filtros</button>
      </div>

      <div className="flex flex-wrap items-center" style={{ gap: 6, marginTop: 10 }}>
        <span style={{ fontSize: 11.5, color: T.ink2, fontFamily: "'Inter Tight', sans-serif", marginRight: 2 }}>Produtos:</span>
        {PRODUCTS.map((p) => {
          const active = selectedProducts.has(p);
          const style = PRODUCT_STYLE[p];
          return (
            <button
              key={p}
              onClick={() => toggleProduct(p)}
              style={{
                borderRadius: 8, padding: "4px 9px", fontSize: 11.5, fontWeight: 500, border: `1px solid ${active ? "transparent" : T.border2}`, cursor: "pointer",
                background: active ? style.subtle : "transparent", color: active ? style.text : T.ink2, fontFamily: "'Inter Tight', sans-serif",
              }}
            >
              {p}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: T.ink2, marginTop: 8 }}>{stats.total} issues no recorte atual</p>

      <div style={{ marginTop: 16, borderRadius: 10, border: `1px solid ${palette.insightBorder}`, background: palette.insightBg, padding: "12px 16px", fontSize: 13, lineHeight: 1.5, color: palette.insightText, fontFamily: "'Inter Tight', sans-serif" }}>
        Hoje o time tem <b style={{ color: T.ink0 }}>{stats.ativoCount} issues em andamento</b> distribuídas entre <b style={{ color: T.ink0 }}>{stats.activeAssignees} pessoas</b>.{" "}
        {stats.topAssignee && <>{" "}<b style={{ color: T.ink0 }}>{stats.topAssignee.name}</b> concentra o maior WIP ({stats.topAssignee.count} issues).{" "}</>}
        {stats.worstProject && <>O maior tempo parado está em <b style={{ color: T.ink0 }}>{stats.worstProject.project}</b>, com aging médio de {stats.worstProject.days} dias.</>}
      </div>

      <div className="flex flex-wrap" style={{ gap: 10, marginTop: 16 }}>
        <AnaliseKpi label="Total ativo (sem épicos)" value={stats.total} />
        <AnaliseKpi label="Em andamento agora" value={stats.ativoCount} tone="sky" />
        <AnaliseKpi label="Concluídas (últ. 90 dias)" value={stats.done90} tone="emerald" />
        <AnaliseKpi label="Aging médio geral" value={`${stats.avgAging} dias`} tone="amber" />
        <AnaliseKpi label="Pessoas com WIP agora" value={stats.activeAssignees} />
      </div>

      <SectionTitle title="Onde a aposta estratégica está concentrada" sub="Quantidade de issues por tipo de entrega, por produto" />
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.allocation} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid stroke={T.border2} horizontal={false} />
            <XAxis type="number" tick={rcAxis} axisLine={{ stroke: T.border2 }} tickLine={false} />
            <YAxis type="category" dataKey="project" tick={rcAxis} axisLine={{ stroke: T.border2 }} tickLine={false} width={90} />
            <Tooltip {...rcTooltip} />
            <Legend wrapperStyle={{ fontSize: 11, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }} />
            {stats.dtOrder.map((dt) => (
              <Bar key={dt} dataKey={dt} stackId="a" fill={TIPO_STYLE[dt].dot} radius={[3, 3, 3, 3]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle title="Onde o trabalho está, pelas 8 etapas mapeadas" sub="Volume org-wide em cada etapa do fluxo (Backlog → Em design → ... → Concluído)" />
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.stageDist} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid stroke={T.border2} horizontal={false} />
            <XAxis type="number" tick={rcAxis} axisLine={{ stroke: T.border2 }} tickLine={false} />
            <YAxis type="category" dataKey="stage" tick={rcAxis} axisLine={{ stroke: T.border2 }} tickLine={false} width={110} />
            <Tooltip {...rcTooltip} formatter={(v) => [`${v} issues`, ""]} />
            <Bar dataKey="count" radius={[3, 3, 3, 3]} maxBarSize={18}>
              {stats.stageDist.map((entry, i) => (
                <Cell key={i} fill={entry.stage === "Concluído" ? palette.stageDoneColor : palette.stageBarColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle title="Quem está sobrecarregado" sub="Issues em andamento agora, por responsável (todos os produtos)" />
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.wipEntries} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid stroke={T.border2} horizontal={false} />
            <XAxis type="number" tick={rcAxis} axisLine={{ stroke: T.border2 }} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={rcAxis} axisLine={{ stroke: T.border2 }} tickLine={false} width={110} />
            <Tooltip {...rcTooltip} formatter={(v) => [`${v} issues em andamento`, ""]} />
            <Bar dataKey="count" radius={[3, 3, 3, 3]} maxBarSize={16}>
              {stats.wipEntries.map((_, i) => <Cell key={i} fill={i === 0 ? palette.highlightColor : palette.neutralBarColor} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle title="Onde o trabalho está empacado" sub="Aging médio (dias) das issues em andamento, por produto" />
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.agingEntries} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid stroke={T.border2} horizontal={false} />
            <XAxis type="number" tick={rcAxis} axisLine={{ stroke: T.border2 }} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="project" tick={rcAxis} axisLine={{ stroke: T.border2 }} tickLine={false} width={90} />
            <Tooltip {...rcTooltip} formatter={(v) => [`${v} dias em média`, ""]} />
            <Bar dataKey="days" radius={[3, 3, 3, 3]} maxBarSize={16}>
              {stats.agingEntries.map((_, i) => <Cell key={i} fill={i === 0 ? palette.highlightColor : palette.neutralBarColor} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle title="Ritmo de entrega da organização" sub="Issues criadas vs. concluídas, por mês" />
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stats.throughput} margin={{ left: 4 }}>
            <CartesianGrid stroke={T.border2} vertical={false} />
            <XAxis dataKey="month" tick={rcAxis} axisLine={{ stroke: T.border2 }} tickLine={false} />
            <YAxis tick={rcAxis} axisLine={{ stroke: T.border2 }} tickLine={false} allowDecimals={false} />
            <Tooltip {...rcTooltip} />
            <Legend wrapperStyle={{ fontSize: 11, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }} />
            <Line type="monotone" dataKey="Criadas" stroke={palette.lineCreated} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Concluídas" stroke={palette.lineDone} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle title="Quem reporta, quem desenvolve, quem testa" sub="Volume de issues por pessoa (campos Reporter, Desenvolvedor e Quem testou do Jira)" />
      {[
        { title: "Principais reporters", data: stats.topReporters, color: palette.reporterColor },
        { title: "Principais desenvolvedores", data: stats.topDevelopers, color: palette.devColor },
        { title: "Principais responsáveis por teste", data: stats.topTesters, color: palette.testerColor },
      ].map(({ title, data, color }) => (
        <div key={title}>
          <p style={{ fontSize: 12.5, color: T.ink1, margin: "10px 0 4px", fontFamily: "'Inter Tight', sans-serif" }}>{title}</p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid stroke={T.border2} horizontal={false} />
                <XAxis type="number" tick={rcAxis} axisLine={{ stroke: T.border2 }} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={rcAxis} axisLine={{ stroke: T.border2 }} tickLine={false} width={110} />
                <Tooltip {...rcTooltip} formatter={(v) => [`${v} issues`, ""]} />
                <Bar dataKey="count" fill={color} radius={[3, 3, 3, 3]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}

      <div style={{ borderTop: `1px solid ${T.border1}`, margin: "26px 0 0" }} />
      <SectionTitle title="Suporte — veio do Intercom" sub='Issues cujo título traz a tag "[Intercom]", todos os produtos Dev' />
      <div className="flex flex-wrap" style={{ gap: 10 }}>
        <AnaliseKpi label="Total vindo do Intercom" value={`${stats.support.length} (${stats.supportPct}%)`} tone="sky" />
        <AnaliseKpi label="Concluído" value={`${stats.supportDone} (${stats.supportPctDone}%)`} tone="emerald" />
        <AnaliseKpi label="Em andamento" value={stats.supportAtivo} />
        <AnaliseKpi label="Backlog" value={stats.supportBacklog} />
      </div>
      <div style={{ height: 200, marginTop: 14 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.supportByProject} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid stroke={T.border2} horizontal={false} />
            <XAxis type="number" tick={rcAxis} axisLine={{ stroke: T.border2 }} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="project" tick={rcAxis} axisLine={{ stroke: T.border2 }} tickLine={false} width={90} />
            <Tooltip {...rcTooltip} formatter={(v) => [`${v} issues`, ""]} />
            <Bar dataKey="count" fill={palette.lineCreated} radius={[3, 3, 3, 3]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* =====================================================================
   SEMANAL — Destaques (limpo) + Todas as tasks da semana + totalizador
   ===================================================================== */

const SEMANAL_DESTAQUES_KEY = "semanal-destaques-v1";
const SEMANAL_STATUS_COLS = [
  { key: "fila", label: "Fila para dev", accent: "#75797d", tooltip: "Status 'Fila da Sprint' (ou 'Fila da sprint UX') — refinado e aguardando entrar em desenvolvimento.", match: (t) => t.status === "Fila da Sprint" || t.status === "Fila da sprint UX" },
  { key: "emdev", label: "Em dev", accent: "#ad54ff", tooltip: "Em DEV, Code Review, Pronta p/ teste, Em testes ou Pronto p/ Deploy — em algum ponto do desenvolvimento.", match: (t) => t.stage === "Em dev" },
  { key: "concluido", label: "Concluído", accent: "#00aa6c", tooltip: "Status Concluído com Data Concluído nos últimos 10 dias.", match: (t) => t.stage === "Concluído" },
];

function todayStr() {
  const d = NOW_DATE;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function DestaqueRow({ task, onOpen }) {
  const { T, PRODUCT_STYLE, TIPO_STYLE } = useTheme();
  const prod = PRODUCT_STYLE[task.project] || PRODUCT_STYLE["Backoffice"];
  const layer = TIPO_STYLE[layerOf(task)];
  return (
    <div
      onClick={() => onOpen(task)}
      className="flex items-center justify-between"
      style={{ padding: "8px 10px", borderRadius: 8, cursor: "pointer", gap: 10 }}
    >
      <div className="flex items-center" style={{ gap: 8, minWidth: 0 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: layer.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: T.ink2, fontFamily: "'Inter Tight', sans-serif", flexShrink: 0 }}>{task.key}</span>
        <span style={{ fontSize: 12.5, color: T.ink0, fontFamily: "'Inter Tight', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.summary}</span>
      </div>
      <Badge bg={prod.subtle} color={prod.text}>{task.project}</Badge>
    </div>
  );
}

function SemanalCard({ task, onOpen, onDragStart, checked, onToggle, readOnly }) {
  const { T, PRODUCT_STYLE, TIPO_STYLE } = useTheme();
  const { epics } = useData();
  const prod = PRODUCT_STYLE[task.project] || PRODUCT_STYLE["Backoffice"];
  const layer = TIPO_STYLE[layerOf(task)];
  const epic = epicLabel(epics, task.parent);
  return (
    <div
      draggable={!readOnly} onDragStart={(e) => onDragStart && onDragStart(e, task.key)}
      onClick={() => onOpen(task)}
      className="pp-card"
      style={{ background: T.bg1, border: `1px solid ${T.border2}`, borderRadius: 12, padding: 10, cursor: readOnly ? "pointer" : "grab", boxShadow: T.cardShadow }}
    >
      <div className="flex items-start justify-between" style={{ gap: 8 }}>
        <div className="flex items-center" style={{ gap: 6, minWidth: 0 }}>
          {onToggle && !readOnly && (
            <input
              type="checkbox" checked={!!checked}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onToggle(task.key, e.target.checked)}
              style={{ accentColor: "#5166e6", cursor: "pointer", flexShrink: 0 }}
            />
          )}
          <span style={{ fontSize: 11, fontWeight: 500, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>{task.key}</span>
        </div>
        <div className="flex items-center" style={{ gap: 4, flexShrink: 0 }}>
          {task.intercom && <Badge bg={PRODUCT_STYLE["STLFLIX"].subtle} color={PRODUCT_STYLE["STLFLIX"].text}>Intercom</Badge>}
          <Badge bg={prod.subtle} color={prod.text}>{task.project}</Badge>
        </div>
      </div>
      <p style={{ marginTop: 6, fontSize: 13, lineHeight: 1.35, color: T.ink0, fontFamily: "'Inter Tight', sans-serif", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {task.summary || "(sem título)"}
      </p>
      {epic && (
        <p style={{ marginTop: 3, fontSize: 10.5, color: T.ink2, fontFamily: "'Inter Tight', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          ⌂ {epic}
        </p>
      )}
      <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
        <span className="inline-flex items-center" style={{ gap: 5, fontSize: 11, color: layer.text, fontFamily: "'Inter Tight', sans-serif" }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: layer.dot, display: "inline-block" }} />{layerOf(task)}
        </span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 999, background: T.bg2, color: T.ink0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", border: `1px solid ${T.border2}`, fontFamily: "'Inter Tight', sans-serif" }}>
          {initials(task.assignee)}
        </div>
      </div>
    </div>
  );
}

function SemanalDropGrid({ tasks, emptyLabel, onOpen, onDragStart, onDrop, accent, checkedKeys, onToggle, readOnly }) {
  const { T } = useTheme();
  const [isOver, setIsOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }} onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { setIsOver(false); onDrop(e); }}
      style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, minHeight: 90,
        borderRadius: 10, border: `1px dashed ${isOver ? accent : "transparent"}`, background: isOver ? `${accent}10` : "transparent", padding: isOver ? 6 : 0, transition: "all 120ms",
      }}
    >
      {tasks.length === 0 && <p style={{ fontSize: 12, color: T.ink2, fontFamily: "'Inter Tight', sans-serif" }}>{emptyLabel}</p>}
      {tasks.map((t) => (
        <SemanalCard
          key={t.key} task={t} onOpen={onOpen} onDragStart={onDragStart}
          checked={checkedKeys ? checkedKeys.has(t.key) : undefined} onToggle={onToggle}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

function SemanalScreen() {
  const { T, TIPO_STYLE, PRODUCT_STYLE } = useTheme();
  const { tasks: TASKS_SEED } = useData();
  // Os destaques da semana são a leitura do time sobre a semana: escrita do super.
  const { canWriteShared } = useAuth();
  const [openTask, setOpenTask] = useState(null);
  const [destaqueKeys, setDestaqueKeys] = useState(() => new Set());
  const [tipoFilter, setTipoFilter] = useState(null);
  const [produtoFilter, setProdutoFilter] = useState(null);
  const [dateMode, setDateMode] = useState("10");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [dragKey, setDragKey] = useState(null);
  const [saving, setSaving] = useState(false);

  const byKey = useMemo(() => Object.fromEntries(TASKS_SEED.map((t) => [t.key, t])), [TASKS_SEED]);

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(SEMANAL_DESTAQUES_KEY, true);
        if (res && res.value) {
          const saved = JSON.parse(res.value);
          if (Array.isArray(saved.keys)) setDestaqueKeys(new Set(saved.keys.filter((k) => byKey[k])));
        }
      } catch (e) {}
    })();
  }, [byKey]);

  const persistDestaques = useCallback(async (nextSet) => {
    setSaving(true);
    try { await storage.set(SEMANAL_DESTAQUES_KEY, JSON.stringify({ keys: [...nextSet] }), true); } catch (e) {}
    setSaving(false);
  }, []);

  const dateRange = useMemo(() => {
    if (dateMode === "custom") {
      const start = customRange.start ? new Date(`${customRange.start}T00:00:00`) : null;
      const end = customRange.end ? new Date(`${customRange.end}T23:59:59`) : NOW_DATE;
      if (!start) return { start: addDays(NOW_DATE, -10), end: NOW_DATE };
      return { start, end };
    }
    const days = dateMode === "30" ? 30 : 10;
    return { start: addDays(NOW_DATE, -days), end: NOW_DATE };
  }, [dateMode, customRange]);

  const isRecentlyDone = useCallback((task) => {
    if (task.stage !== "Concluído") return false;
    const d = parseBRDate(task.dataConcl);
    if (!d) return false;
    return d >= dateRange.start && d <= dateRange.end;
  }, [dateRange]);

  const weekTasksAll = useMemo(
    () => TASKS_SEED.filter((t) =>
      t.status !== "Pronto P/ DEV" &&
      (t.stage === "Pronta pra dev" || t.stage === "Em dev" || isRecentlyDone(t) || destaqueKeys.has(t.key))
    ),
    [TASKS_SEED, isRecentlyDone, destaqueKeys]
  );

  const destaqueTasksAll = useMemo(() => weekTasksAll.filter((t) => destaqueKeys.has(t.key)), [weekTasksAll, destaqueKeys]);
  const weekTasksRest = useMemo(() => weekTasksAll.filter((t) => !destaqueKeys.has(t.key)), [weekTasksAll, destaqueKeys]);
  const destaqueTasks = useMemo(
    () => destaqueTasksAll.filter((t) => (!tipoFilter || layerOf(t) === tipoFilter) && (!produtoFilter || t.project === produtoFilter)),
    [destaqueTasksAll, tipoFilter, produtoFilter]
  );
  const weekTasks = useMemo(
    () => weekTasksRest.filter((t) => (!tipoFilter || layerOf(t) === tipoFilter) && (!produtoFilter || t.project === produtoFilter)),
    [weekTasksRest, tipoFilter, produtoFilter]
  );

  const totals = useMemo(() => {
    const c = { "Sustentação": 0, "Inovação": 0, "Melhoria": 0 };
    weekTasksAll
      .filter((t) => !produtoFilter || t.project === produtoFilter)
      .forEach((t) => { const l = layerOf(t); if (c[l] !== undefined) c[l] += 1; });
    return c;
  }, [weekTasksAll, produtoFilter]);

  const totalsByProduct = useMemo(() => {
    const c = {};
    PRODUCTS.forEach((p) => (c[p] = 0));
    weekTasksAll
      .filter((t) => !tipoFilter || layerOf(t) === tipoFilter)
      .forEach((t) => { if (c[t.project] !== undefined) c[t.project] += 1; });
    return c;
  }, [weekTasksAll, tipoFilter]);

  const totalsByPerson = useMemo(() => {
    const c = {};
    weekTasksAll
      .filter((t) => (!tipoFilter || layerOf(t) === tipoFilter) && (!produtoFilter || t.project === produtoFilter))
      .forEach((t) => {
        const name = t.assignee || "Sem responsável";
        c[name] = (c[name] || 0) + 1;
      });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [weekTasksAll, tipoFilter, produtoFilter]);

  const onDragStart = (e, key) => { setDragKey(key); e.dataTransfer.effectAllowed = "move"; };
  const setHighlighted = (key, isHighlighted) => {
    if (!canWriteShared) return;
    const next = new Set(destaqueKeys);
    isHighlighted ? next.add(key) : next.delete(key);
    setDestaqueKeys(next); persistDestaques(next);
  };
  const addToDestaques = () => { if (dragKey) setHighlighted(dragKey, true); setDragKey(null); };
  const removeFromDestaques = () => { if (dragKey) setHighlighted(dragKey, false); setDragKey(null); };
  const onToggle = (key, checked) => setHighlighted(key, checked);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 40px" }}>
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: T.ink0 }}>Semanal</h1>
          <p style={{ fontSize: 12, color: T.ink1, marginTop: 2 }}>
            Status: Pronta pra dev + Em dev · Concluído {dateMode === "custom" ? `entre ${fmtWeek(dateRange.start)} e ${fmtWeek(dateRange.end)}` : `nos últimos ${dateMode} dias`}
          </p>
          {saving && <span style={{ fontSize: 11, color: T.ink2 }}>salvando…</span>}
        </div>
        <div className="flex items-center" style={{ gap: 8, flexShrink: 0 }}>
          <div className="flex items-center" style={{ gap: 2, borderRadius: 8, border: `1px solid ${T.border2}`, padding: 2 }}>
            {[["10", "10 dias"], ["30", "30 dias"], ["custom", "Personalizado"]].map(([key, label]) => {
              const active = dateMode === key;
              return (
                <button
                  key={key} onClick={() => setDateMode(key)}
                  style={{ borderRadius: 6, padding: "5px 10px", fontSize: 11.5, fontWeight: 500, border: "none", cursor: "pointer", background: active ? "#5166e6" : "transparent", color: active ? "#fff" : T.ink1, fontFamily: "'Inter Tight', sans-serif" }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {dateMode === "custom" && (
            <div className="flex items-center" style={{ gap: 4 }}>
              <input
                type="date" value={customRange.start}
                onChange={(e) => setCustomRange((r) => ({ ...r, start: e.target.value }))}
                style={{ borderRadius: 6, border: `1px solid ${T.border2}`, background: T.bg1, color: T.ink0, fontSize: 11.5, padding: "5px 6px", fontFamily: "'Inter Tight', sans-serif" }}
              />
              <span style={{ fontSize: 11, color: T.ink2 }}>até</span>
              <input
                type="date" value={customRange.end}
                onChange={(e) => setCustomRange((r) => ({ ...r, end: e.target.value }))}
                style={{ borderRadius: 6, border: `1px solid ${T.border2}`, background: T.bg1, color: T.ink0, fontSize: 11.5, padding: "5px 6px", fontFamily: "'Inter Tight', sans-serif" }}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20, marginBottom: 10 }} className="flex items-center justify-between">
        <p style={{ fontSize: 14, fontWeight: 700, color: T.ink0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Totalizadores</p>
        {(tipoFilter || produtoFilter) && (
          <button onClick={() => { setTipoFilter(null); setProdutoFilter(null); }} style={{ fontSize: 12, color: T.ink1, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "'Inter Tight', sans-serif" }}>
            Limpar filtro
          </button>
        )}
      </div>
      <div className="flex flex-wrap" style={{ gap: 10 }}>
        {["Sustentação", "Melhoria", "Inovação"].map((tipo) => {
          const style = TIPO_STYLE[tipo];
          const active = tipoFilter === tipo;
          return (
            <div
              key={tipo} onClick={() => setTipoFilter((prev) => (prev === tipo ? null : tipo))}
              style={{ flex: 1, minWidth: 140, borderRadius: 12, cursor: "pointer", border: `1px solid ${active ? style.dot : T.border2}`, background: active ? style.subtle : T.bg1, padding: 14, transition: "all 120ms" }}
            >
              <span className="inline-flex items-center" style={{ gap: 6, fontSize: 12, color: style.text, fontFamily: "'Inter Tight', sans-serif" }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: style.dot, display: "inline-block" }} />{tipo}
              </span>
              <p style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: T.ink0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{totals[tipo]}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap" style={{ gap: 10, marginTop: 14 }}>
        {PRODUCTS.map((p) => {
          const style = PRODUCT_STYLE[p];
          const active = produtoFilter === p;
          return (
            <div
              key={p} onClick={() => setProdutoFilter((prev) => (prev === p ? null : p))}
              style={{ flex: 1, minWidth: 120, borderRadius: 12, cursor: "pointer", border: `1px solid ${active ? style.primary : T.border2}`, background: active ? style.subtle : T.bg1, padding: "10px 12px", transition: "all 120ms" }}
            >
              <span className="inline-flex items-center" style={{ gap: 6, fontSize: 11, color: style.text, fontFamily: "'Inter Tight', sans-serif" }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: style.primary, display: "inline-block" }} />{p}
              </span>
              <p style={{ marginTop: 4, fontSize: 20, fontWeight: 700, color: T.ink0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{totalsByProduct[p]}</p>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: 18, marginBottom: 8, fontSize: 12, fontWeight: 600, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>Capacity — tarefas por pessoa</p>
      <div className="pp-scroll flex" style={{ gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {totalsByPerson.map(([name, count]) => (
          <div key={name} className="inline-flex items-center" style={{ gap: 6, flexShrink: 0, borderRadius: 999, border: `1px solid ${T.border2}`, background: T.bg1, padding: "4px 10px 4px 4px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 999, background: T.bg2, color: T.ink0, fontSize: 9, fontWeight: 700, textTransform: "uppercase", border: `1px solid ${T.border2}`, fontFamily: "'Inter Tight', sans-serif", flexShrink: 0 }}>
              {initials(name === "Sem responsável" ? null : name)}
            </div>
            <span style={{ fontSize: 11.5, color: T.ink0, fontFamily: "'Inter Tight', sans-serif", whiteSpace: "nowrap" }}>{name}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>{count}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, marginBottom: 10 }} className="flex items-center justify-between">
        <p style={{ fontSize: 14, fontWeight: 700, color: T.ink0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Destaques</p>
        <span style={{ fontSize: 12, color: T.ink2, fontFamily: "'Inter Tight', sans-serif" }}>{destaqueTasks.length} itens</span>
      </div>
      <div className="flex" style={{ gap: 14 }}>
        {SEMANAL_STATUS_COLS.map((col) => {
          const colTasks = destaqueTasks.filter(col.match);
          return (
            <div key={col.key} style={{ flex: 1, minWidth: 0 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <span title={col.tooltip} style={{ fontSize: 12.5, fontWeight: 600, color: T.ink0, fontFamily: "'Inter Tight', sans-serif", cursor: "help", borderBottom: `1px dotted ${T.ink2}` }}>{col.label}</span>
                <span style={{ fontSize: 11, color: T.ink2, fontFamily: "'Inter Tight', sans-serif" }}>{colTasks.length}</span>
              </div>
              <SemanalDropGrid
                tasks={colTasks} emptyLabel="Arraste um card pra aqui."
                onOpen={setOpenTask} onDragStart={onDragStart} onDrop={addToDestaques} accent={col.accent}
                checkedKeys={destaqueKeys} onToggle={onToggle} readOnly={!canWriteShared}
              />
            </div>
          );
        })}
      </div>
      {(() => {
        const otherTasks = destaqueTasks.filter((t) => !SEMANAL_STATUS_COLS.some((c) => c.match(t)));
        if (!otherTasks.length) return null;
        return (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 11.5, color: T.ink2, marginBottom: 6, fontFamily: "'Inter Tight', sans-serif" }}>Outras etapas ({otherTasks.length})</p>
            <SemanalDropGrid tasks={otherTasks} emptyLabel="" onOpen={setOpenTask} onDragStart={onDragStart} onDrop={addToDestaques} accent="#75797d" checkedKeys={destaqueKeys} onToggle={onToggle} readOnly={!canWriteShared} />
          </div>
        );
      })()}

      <div style={{ marginTop: 24, marginBottom: 10 }} className="flex items-center justify-between">
        <p style={{ fontSize: 14, fontWeight: 700, color: T.ink0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Todas as tasks da semana</p>
        <span style={{ fontSize: 12, color: T.ink2, fontFamily: "'Inter Tight', sans-serif" }}>{weekTasks.length} itens</span>
      </div>
      <div className="flex" style={{ gap: 14 }}>
        {SEMANAL_STATUS_COLS.map((col) => {
          const colTasks = weekTasks.filter(col.match);
          return (
            <div key={col.key} style={{ flex: 1, minWidth: 0 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <span title={col.tooltip} style={{ fontSize: 12.5, fontWeight: 600, color: T.ink0, fontFamily: "'Inter Tight', sans-serif", cursor: "help", borderBottom: `1px dotted ${T.ink2}` }}>{col.label}</span>
                <span style={{ fontSize: 11, color: T.ink2, fontFamily: "'Inter Tight', sans-serif" }}>{colTasks.length}</span>
              </div>
              <SemanalDropGrid
                tasks={colTasks} emptyLabel="Nada aqui."
                onOpen={setOpenTask} onDragStart={onDragStart} onDrop={removeFromDestaques} accent={col.accent}
                checkedKeys={destaqueKeys} onToggle={onToggle} readOnly={!canWriteShared}
              />
            </div>
          );
        })}
      </div>
      {(() => {
        const otherTasks = weekTasks.filter((t) => !SEMANAL_STATUS_COLS.some((c) => c.match(t)));
        if (!otherTasks.length) return null;
        return (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 11.5, color: T.ink2, marginBottom: 6, fontFamily: "'Inter Tight', sans-serif" }}>Outras etapas ({otherTasks.length})</p>
            <SemanalDropGrid tasks={otherTasks} emptyLabel="" onOpen={setOpenTask} onDragStart={onDragStart} onDrop={removeFromDestaques} accent="#75797d" checkedKeys={destaqueKeys} onToggle={onToggle} readOnly={!canWriteShared} />
          </div>
        );
      })()}

      <TaskDrawer task={openTask} onClose={() => setOpenTask(null)} onMove={() => {}} canWrite={canWriteShared} />
    </div>
  );
}

/* =====================================================================
   ROADMAP (GANTT) — épicos por semana, camadas fixas por produto
   ===================================================================== */

const PRIORIZACAO_KEY = "__PRIORIZACAO__";
const ROADMAP_STORAGE_KEY = "roadmap-v1";

function startOfWeek(d) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fmtWeek(d) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}
function layoutLane(epics) {
  const sorted = [...epics].sort((a, b) => a.startWeek - b.startWeek);
  const rowEnds = [];
  const rowOf = {};
  sorted.forEach((e) => {
    let placed = false;
    for (let r = 0; r < rowEnds.length; r++) {
      if (rowEnds[r] <= e.startWeek) { rowEnds[r] = e.startWeek + e.durationWeeks; rowOf[e.key] = r; placed = true; break; }
    }
    if (!placed) { rowEnds.push(e.startWeek + e.durationWeeks); rowOf[e.key] = rowEnds.length - 1; }
  });
  return { rowOf, rowCount: Math.max(1, rowEnds.length) };
}

function PrioCard({ epic, onDragStart, onOpen, onAdd, onMoveToFila, onDragOverCard, onDropOnCard, onDragEndCard, dropIndicator, canDrag }) {
  const { T, PRODUCT_STYLE, TIPO_STYLE } = useTheme();
  const prod = epic.project ? (PRODUCT_STYLE[epic.project] || PRODUCT_STYLE["Backoffice"]) : null;
  const tipo = TIPO_STYLE[layerOf(epic)];
  return (
    <div
      draggable={canDrag} onDragStart={(e) => onDragStart(e, epic.key)} onClick={() => onOpen(epic)}
      onDragOver={onDragOverCard && ((e) => onDragOverCard(e, epic.key))}
      onDrop={onDropOnCard && ((e) => onDropOnCard(e, epic.key))}
      onDragEnd={onDragEndCard}
      className="pp-card"
      style={{
        background: T.bg1, cursor: canDrag ? "grab" : "pointer", boxShadow: T.cardShadow, minWidth: 150, maxWidth: 220,
        borderRadius: 10, padding: "6px 10px",
        borderTop: `1px solid ${T.border2}`, borderBottom: `1px solid ${T.border2}`,
        borderLeft: dropIndicator === "before" ? `2px solid ${prod ? prod.primary : "#5166e6"}` : `1px solid ${T.border2}`,
        borderRight: dropIndicator === "after" ? `2px solid ${prod ? prod.primary : "#5166e6"}` : `1px solid ${T.border2}`,
      }}
    >
      <div className="flex items-center justify-between" style={{ gap: 6 }}>
        <div className="flex items-center" style={{ gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 10.5, fontWeight: 500, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>{epic.key}</span>
        </div>
        {prod && <span style={{ width: 6, height: 6, borderRadius: 999, background: prod.primary, display: "inline-block" }} />}
      </div>
      {(onAdd || onMoveToFila) && (
        <div className="flex items-center" style={{ gap: 10, marginTop: 3 }}>
          {onMoveToFila && (
            <label className="inline-flex items-center" style={{ gap: 3, fontSize: 9, color: T.ink2, fontFamily: "'Inter Tight', sans-serif", cursor: "pointer" }} onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox" checked={false} title="Mover para Na fila"
                onChange={(e) => { e.stopPropagation(); onMoveToFila(epic.key); }}
                style={{ accentColor: prod ? prod.primary : "#5166e6", cursor: "pointer", flexShrink: 0 }}
              />
              Na fila
            </label>
          )}
          {onAdd && (
            <label className="inline-flex items-center" style={{ gap: 3, fontSize: 9, color: T.ink2, fontFamily: "'Inter Tight', sans-serif", cursor: "pointer" }} onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox" checked={false} title="Adicionar ao Gantt"
                onChange={(e) => { e.stopPropagation(); onAdd(epic.key); }}
                style={{ accentColor: prod ? prod.primary : "#5166e6", cursor: "pointer", flexShrink: 0 }}
              />
              Gantt
            </label>
          )}
        </div>
      )}
      <p style={{ marginTop: 2, fontSize: 12, color: T.ink0, fontFamily: "'Inter Tight', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{epic.summary || "(sem título)"}</p>
      {epic.status && (
        <span style={{ display: "inline-block", marginTop: 4, borderRadius: 6, padding: "1px 6px", fontSize: 9.5, fontWeight: 500, background: T.bg2, color: T.ink1, fontFamily: "'Inter Tight', sans-serif", whiteSpace: "nowrap" }}>
          {epic.status}
        </span>
      )}
      <div className="flex items-center justify-between" style={{ marginTop: 5 }}>
        <span className="inline-flex items-center" style={{ gap: 4, fontSize: 10, color: tipo.text, fontFamily: "'Inter Tight', sans-serif" }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: tipo.dot, display: "inline-block" }} />{layerOf(epic)}
        </span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 17, height: 17, borderRadius: 999, background: T.bg2, color: T.ink0, fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", border: `1px solid ${T.border2}`, fontFamily: "'Inter Tight', sans-serif" }}>
          {initials(epic.assignee)}
        </div>
      </div>
    </div>
  );
}

function EpicBar({ epic, onDragStart, onOpen, onResize, onRemove, canEdit }) {
  const { T, PRODUCT_STYLE } = useTheme();
  const prod = PRODUCT_STYLE[epic.roadmapLane] || PRODUCT_STYLE["Backoffice"];
  return (
    <div
      draggable={canEdit} onDragStart={(e) => onDragStart(e, epic.key)} onClick={() => onOpen(epic)}
      style={{
        display: "flex", alignItems: "center", gap: 6, height: 26, borderRadius: 7, padding: "0 8px", cursor: canEdit ? "grab" : "pointer",
        background: prod.subtle, border: `1px solid ${prod.primary}55`, overflow: "hidden", margin: "3px 2px",
        width: "100%", boxSizing: "border-box",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: 999, background: prod.primary, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 500, color: prod.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'Inter Tight', sans-serif", flex: "1 1 auto", minWidth: 0 }}>
        {epic.summary}
      </span>
      {canEdit && (
        <span style={{ marginLeft: "auto", display: "flex", gap: 2, flexShrink: 0 }}>
          <button onClick={(e) => { e.stopPropagation(); onResize(epic.key, -1); }} style={{ display: "flex", background: "none", border: "none", color: prod.text, cursor: "pointer", padding: 1 }}><Minus size={10} /></button>
          <button onClick={(e) => { e.stopPropagation(); onResize(epic.key, 1); }} style={{ display: "flex", background: "none", border: "none", color: prod.text, cursor: "pointer", padding: 1 }}><Plus size={10} /></button>
          <button title="Excluir do Gantt" onClick={(e) => { e.stopPropagation(); onRemove(epic.key); }} style={{ display: "flex", background: "none", border: "none", color: prod.text, cursor: "pointer", padding: 1 }}><X size={11} /></button>
        </span>
      )}
    </div>
  );
}

function RoadmapScreen() {
  const { T, PRODUCT_STYLE } = useTheme();
  const {
    epics: EPICS_SEED,
    positions, setPositions, customEpics, setCustomEpics, prioOrder, setPrioOrder, filaOrder, setFilaOrder,
    roadmapSaving: saving, persistRoadmap: persist, updatePosition, addEpic: addEpicShared, deleteEpic: deleteEpicShared, saveDrawer: saveDrawerShared,
  } = useData();
  // Único lugar onde o admin escreve: cria card e mexe NOS DELE (posição no
  // Gantt, fila, nome, duração, exclusão). Épico da planilha não tem dono, então
  // só o super o move. Reordenar as listas mexe na ordem de todo mundo: super.
  const { user, canCreateCard, ownsCard, canWriteShared } = useAuth();
  const [weekCount, setWeekCount] = useState(13);
  const [openKey, setOpenKey] = useState(null);
  const [dragKey, setDragKey] = useState(null);
  const [prioDropInfo, setPrioDropInfo] = useState(null);
  const [filaDropInfo, setFilaDropInfo] = useState(null);

  const addEpic = () => { const key = addEpicShared(); if (key) setOpenKey(key); };
  const deleteEpic = (key) => { deleteEpicShared(key); setOpenKey(null); };
  const saveDrawer = (key, patch) => { saveDrawerShared(key, patch); setOpenKey(null); };

  const allEpics = useMemo(() => [...EPICS_SEED, ...customEpics], [EPICS_SEED, customEpics]);
  const byKey = useMemo(() => Object.fromEntries(allEpics.map((e) => [e.key, e])), [allEpics]);

  const PAST_WEEKS = 4; // ~1 mês antes de hoje, sempre visível pra trás

  const weeks = useMemo(() => {
    const start = addDays(startOfWeek(NOW_DATE), -PAST_WEEKS * 7);
    return Array.from({ length: weekCount + PAST_WEEKS }, (_, i) => ({ index: i - PAST_WEEKS, start: addDays(start, i * 7) }));
  }, [weekCount]);
  const currentWeekIndex = 0;
  const colOf = (index) => index + PAST_WEEKS + 2;

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = PAST_WEEKS * 84;
  }, []);

  const enriched = useMemo(() => allEpics.map((e) => ({ ...e, ...(positions[e.key] || { roadmapLane: null, startWeek: null, durationWeeks: 2 }) })), [allEpics, positions]);
  const backlogItems = enriched.filter((e) => !e.roadmapLane && e.status !== "Done");
  const filaSet = useMemo(() => new Set(filaOrder), [filaOrder]);
  const filaItems = useMemo(() => {
    const byKeyFila = Object.fromEntries(backlogItems.filter((e) => filaSet.has(e.key)).map((e) => [e.key, e]));
    return filaOrder.map((k) => byKeyFila[k]).filter(Boolean);
  }, [backlogItems, filaOrder, filaSet]);
  const prioItemsRaw = backlogItems.filter((e) => !filaSet.has(e.key));
  const prioItems = useMemo(() => {
    const byKeyPrio = Object.fromEntries(prioItemsRaw.map((e) => [e.key, e]));
    const known = prioOrder.filter((k) => byKeyPrio[k]);
    const unknown = prioItemsRaw.filter((e) => !prioOrder.includes(e.key)).map((e) => e.key);
    return [...known, ...unknown].map((k) => byKeyPrio[k]);
  }, [prioItemsRaw, prioOrder]);
  const prioByProduct = useMemo(() => {
    const groups = PRODUCTS.map((p) => ({ product: p, items: prioItems.filter((e) => e.project === p) }));
    const outros = prioItems.filter((e) => !e.project);
    if (outros.length) groups.push({ product: "Sem produto", items: outros });
    return groups;
  }, [prioItems]);

  const laneMeta = useMemo(() => {
    let rowCursor = 2;
    return PRODUCTS.map((p) => {
      const scheduled = enriched.filter((e) => e.roadmapLane === p && e.startWeek !== null);
      const { rowOf, rowCount } = layoutLane(scheduled);
      const startRow = rowCursor;
      rowCursor += rowCount;
      return { product: p, scheduled, rowOf, rowCount, startRow };
    });
  }, [enriched]);
  const totalRows = laneMeta.reduce((s, l) => s + l.rowCount, 2);

  const onDragStart = (e, key) => { setDragKey(key); e.dataTransfer.effectAllowed = "move"; };
  const onDropPrio = (e) => {
    e.preventDefault();
    if (dragKey && ownsCard(byKey[dragKey])) {
      const nextPositions = { ...positions, [dragKey]: { ...(positions[dragKey] || {}), roadmapLane: null, startWeek: null } };
      const nextFila = filaOrder.filter((k) => k !== dragKey);
      setPositions(nextPositions);
      setFilaOrder(nextFila);
      persist(nextPositions, customEpics, prioOrder, nextFila);
    }
    setDragKey(null);
  };
  const moveToFila = (key) => {
    if (!ownsCard(byKey[key])) return;
    if (filaOrder.includes(key)) return;
    const nextFila = [...filaOrder, key];
    setFilaOrder(nextFila);
    persist(positions, customEpics, prioOrder, nextFila);
  };
  const onPrioDragOverCard = (e, overKey) => {
    e.preventDefault(); e.stopPropagation();
    if (!dragKey || overKey === dragKey) { setPrioDropInfo(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setPrioDropInfo({ key: overKey, position: e.clientX - rect.left < rect.width / 2 ? "before" : "after" });
  };
  const onPrioDropOnCard = (e, overKey) => {
    e.preventDefault(); e.stopPropagation();
    const key = dragKey;
    const position = prioDropInfo?.position || "before";
    setDragKey(null); setPrioDropInfo(null);
    if (!key || key === overKey) return;
    // Reordenar reescreve a ordem de todos os cards da lista, não só a do card
    // arrastado — por isso é escrita compartilhada, mesmo vindo do dono do card.
    if (!canWriteShared) return;
    const nextPositions = positions[key]?.roadmapLane
      ? { ...positions, [key]: { ...(positions[key] || {}), roadmapLane: null, startWeek: null } }
      : positions;
    const fullOrder = prioItems.map((e) => e.key).filter((k) => k !== key);
    let insertAt = fullOrder.indexOf(overKey);
    if (insertAt === -1) insertAt = fullOrder.length;
    else if (position === "after") insertAt += 1;
    fullOrder.splice(insertAt, 0, key);
    setPositions(nextPositions);
    setPrioOrder(fullOrder);
    persist(nextPositions, customEpics, fullOrder, filaOrder);
  };

  const onFilaDragOverCard = (e, overKey) => {
    e.preventDefault(); e.stopPropagation();
    if (!dragKey || overKey === dragKey) { setFilaDropInfo(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setFilaDropInfo({ key: overKey, position: e.clientX - rect.left < rect.width / 2 ? "before" : "after" });
  };
  const onFilaDropOnCard = (e, overKey) => {
    e.preventDefault(); e.stopPropagation();
    const key = dragKey;
    const position = filaDropInfo?.position || "before";
    setDragKey(null); setFilaDropInfo(null);
    if (!key || key === overKey) return;
    if (!canWriteShared) return;
    const nextPositions = positions[key]?.roadmapLane
      ? { ...positions, [key]: { ...(positions[key] || {}), roadmapLane: null, startWeek: null } }
      : positions;
    const fullOrder = filaOrder.filter((k) => k !== key);
    let insertAt = fullOrder.indexOf(overKey);
    if (insertAt === -1) insertAt = fullOrder.length;
    else if (position === "after") insertAt += 1;
    fullOrder.splice(insertAt, 0, key);
    setPositions(nextPositions);
    setFilaOrder(fullOrder);
    const nextPrio = prioOrder.filter((k) => k !== key);
    setPrioOrder(nextPrio);
    persist(nextPositions, customEpics, nextPrio, fullOrder);
  };
  const onDropFila = (e) => {
    e.preventDefault();
    if (dragKey && !filaOrder.includes(dragKey)) moveToFila(dragKey);
    setDragKey(null);
  };
  const onDropCell = (e, product, weekIndex) => {
    e.preventDefault();
    if (!dragKey) return;
    const cur = positions[dragKey] || { durationWeeks: 2 };
    updatePosition(dragKey, { roadmapLane: product, startWeek: weekIndex, durationWeeks: cur.durationWeeks || 2 });
    setDragKey(null);
  };
  const resizeEpic = (key, delta) => {
    const cur = positions[key] || { durationWeeks: 2 };
    updatePosition(key, { durationWeeks: Math.max(1, Math.min(12, (cur.durationWeeks || 2) + delta)) });
  };

  const removeFromGantt = (key) => {
    updatePosition(key, { roadmapLane: null, startWeek: null });
  };

  const addToGantt = (key) => {
    const epic = enriched.find((e) => e.key === key);
    const cur = positions[key] || { durationWeeks: 2 };
    updatePosition(key, { roadmapLane: epic?.project || null, startWeek: 0, durationWeeks: cur.durationWeeks || 2 });
  };

  const openEpic = openKey ? enriched.find((e) => e.key === openKey) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
      <div style={{ borderBottom: `1px solid ${T.border1}`, padding: "16px 24px" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: T.ink0 }}>Roadmap (Gantt)</h1>
            <p style={{ fontSize: 12, color: T.ink1, marginTop: 2 }}>Épicos por semana · arraste entre camadas (produto) e ao longo do tempo</p>
          </div>
          <div className="flex items-center" style={{ gap: 10 }}>
            {saving && <span style={{ fontSize: 11, color: T.ink2 }}>salvando…</span>}
            {canCreateCard && (
              <button onClick={addEpic} style={{ display: "flex", alignItems: "center", gap: 5, borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", background: "#5166e6", color: "#fff", fontFamily: "'Inter Tight', sans-serif" }}>
                <Plus size={12} /> Novo épico
              </button>
            )}
            <div className="flex items-center" style={{ gap: 4 }}>
              <button onClick={() => setWeekCount((w) => Math.max(6, w - 4))} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 6, border: `1px solid ${T.border2}`, background: T.bg1, color: T.ink0, cursor: "pointer" }}><Minus size={12} /></button>
              <span style={{ fontSize: 12, color: T.ink1, minWidth: 70, textAlign: "center", fontFamily: "'Inter Tight', sans-serif" }}>{weekCount} semanas</span>
              <button onClick={() => setWeekCount((w) => Math.min(26, w + 4))} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 6, border: `1px solid ${T.border2}`, background: T.bg1, color: T.ink0, cursor: "pointer" }}><Plus size={12} /></button>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="pp-scroll" style={{ overflow: "auto", padding: "16px 24px", borderBottom: `1px solid ${T.border1}` }}>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: `160px repeat(${weekCount + PAST_WEEKS}, minmax(84px, 1fr))`, gridTemplateRows: `32px repeat(${totalRows - 1}, 32px)`, minWidth: 160 + (weekCount + PAST_WEEKS) * 84 }}>
          <div style={{ gridColumn: 1, gridRow: 1 }} />
          {weeks.map((w) => (
            <div key={w.index} style={{ gridColumn: colOf(w.index), gridRow: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: w.index === currentWeekIndex ? 700 : 500, color: w.index === currentWeekIndex ? "#5166e6" : T.ink1, borderBottom: `1px solid ${T.border2}`, fontFamily: "'Inter Tight', sans-serif" }}>
              {fmtWeek(w.start)}
            </div>
          ))}

          {laneMeta.map((lane) => {
            const style = PRODUCT_STYLE[lane.product];
            return (
              <React.Fragment key={lane.product}>
                <div style={{ gridColumn: 1, gridRow: `${lane.startRow} / span ${lane.rowCount}`, display: "flex", alignItems: "center", gap: 6, borderRight: `1px solid ${T.border2}`, paddingRight: 8, position: "sticky", left: 0, zIndex: 3, background: T.bg0 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: style.primary, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.ink0, fontFamily: "'Inter Tight', sans-serif" }}>{lane.product}</span>
                </div>
                {weeks.map((w) => (
                  <div
                    key={w.index}
                    onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDropCell(e, lane.product, w.index)}
                    style={{ gridColumn: colOf(w.index), gridRow: `${lane.startRow} / span ${lane.rowCount}`, borderRight: `1px solid ${T.border1}`, borderBottom: `1px solid ${T.border1}` }}
                  />
                ))}
                {lane.scheduled.map((e) => (
                  <div key={e.key} style={{ gridColumn: `${colOf(e.startWeek)} / span ${e.durationWeeks}`, gridRow: lane.startRow + lane.rowOf[e.key], display: "flex", alignItems: "center", zIndex: 1 }}>
                    <EpicBar epic={e} onDragStart={onDragStart} onOpen={() => setOpenKey(e.key)} onResize={resizeEpic} onRemove={removeFromGantt} canEdit={ownsCard(e)} />
                  </div>
                ))}
              </React.Fragment>
            );
          })}

          <div
            style={{
              position: "absolute", top: 0, bottom: 0,
              left: `calc(160px + (${PAST_WEEKS + daysBetween(startOfWeek(NOW_DATE), NOW_DATE) / 7}) * (100% - 160px) / ${weekCount + PAST_WEEKS})`,
              borderLeft: "1.5px dashed #5166e6", opacity: 0.7, zIndex: 2, pointerEvents: "none",
            }}
          />
        </div>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()} onDrop={onDropFila}
        style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border1}` }}
      >
        <p style={{ fontSize: 12.5, fontWeight: 600, color: T.ink0, marginBottom: 3, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Na fila (Produto e UX) <span style={{ color: T.ink2, fontWeight: 400, fontFamily: "'Inter Tight', sans-serif" }}>({filaItems.length})</span></p>
        <p style={{ fontSize: 11.5, color: T.ink2, marginBottom: 10, fontFamily: "'Inter Tight', sans-serif" }}>Próximas prioridades, na ordem em que vamos trabalhar</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 40, borderRadius: 10, border: `1px dashed ${T.border2}`, padding: 8 }}>
          {filaItems.length === 0 && <span style={{ fontSize: 11.5, color: T.ink2, fontFamily: "'Inter Tight', sans-serif" }}>Marque "Na fila" num card de priorização pra trazer pra aqui</span>}
          {filaItems.map((e) => (
            <PrioCard
              key={e.key} epic={e} onDragStart={onDragStart} onOpen={() => setOpenKey(e.key)}
              onAdd={e.project && ownsCard(e) ? addToGantt : undefined}
              onDragOverCard={onFilaDragOverCard} onDropOnCard={onFilaDropOnCard}
              onDragEndCard={() => setFilaDropInfo(null)}
              dropIndicator={filaDropInfo?.key === e.key ? filaDropInfo.position : null}
              canDrag={ownsCard(e)}
            />
          ))}
        </div>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()} onDrop={onDropPrio}
        style={{ padding: "16px 24px" }}
      >
        <p style={{ fontSize: 12.5, fontWeight: 600, color: T.ink0, marginBottom: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Para priorização <span style={{ color: T.ink2, fontWeight: 400, fontFamily: "'Inter Tight', sans-serif" }}>({prioItems.length})</span></p>
        {prioItems.length === 0 && <p style={{ fontSize: 12, color: T.ink2, fontFamily: "'Inter Tight', sans-serif" }}>Arraste um épico pra aqui pra tirar da linha do tempo</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {prioByProduct.map((group) => (
            <div key={group.product}>
              <div className="flex items-center" style={{ gap: 6, marginBottom: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: (PRODUCT_STYLE[group.product] || PRODUCT_STYLE["Backoffice"]).primary, display: "inline-block" }} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: T.ink1, fontFamily: "'Inter Tight', sans-serif" }}>{group.product}</span>
                <span style={{ fontSize: 11, color: T.ink2, fontFamily: "'Inter Tight', sans-serif" }}>({group.items.length})</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 40, borderRadius: 10, border: `1px dashed ${T.border2}`, padding: 8 }}>
                {group.items.length === 0 && <span style={{ fontSize: 11.5, color: T.ink2, fontFamily: "'Inter Tight', sans-serif" }}>Nenhum épico</span>}
                {group.items.map((e) => (
                  <PrioCard
                    key={e.key} epic={e} onDragStart={onDragStart} onOpen={() => setOpenKey(e.key)}
                    onAdd={e.project && ownsCard(e) ? addToGantt : undefined}
                    onMoveToFila={ownsCard(e) ? moveToFila : undefined}
                    onDragOverCard={onPrioDragOverCard} onDropOnCard={onPrioDropOnCard}
                    onDragEndCard={() => setPrioDropInfo(null)}
                    dropIndicator={prioDropInfo?.key === e.key ? prioDropInfo.position : null}
                    canDrag={ownsCard(e)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <EpicDrawer epic={openEpic} weeks={weeks} onClose={() => setOpenKey(null)} onSave={saveDrawer} onDelete={deleteEpic} canEdit={ownsCard(openEpic)} />
    </div>
  );
}

/* =====================================================================
   APP — casca com o menu Projetos / Tarefas / Análises + toggle de tema
   ===================================================================== */

function fmtSyncTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const ROLE_LABEL = { super: "Superusuário", admin: "Admin", user: "Leitura" };

/* =====================================================================
   LOGIN — conta da plataforma Product Ops (mesmo cookie, mesmo JWT)
   ===================================================================== */

function LoginScreen() {
  const { T } = useTheme();
  const { login, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(email.trim(), password);
    setLoading(false);
  };

  const field = {
    width: "100%", borderRadius: 10, border: `1px solid ${T.border2}`, background: T.bg1,
    color: T.ink0, fontSize: 13.5, padding: "10px 12px", fontFamily: "'Inter Tight', sans-serif",
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg0, color: T.ink0, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter Tight', sans-serif" }}>
      <form onSubmit={onSubmit} style={{ width: "100%", maxWidth: 340, background: T.bg1, border: `1px solid ${T.border2}`, borderRadius: 16, padding: 28, boxShadow: T.cardShadow }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "#5166e6", display: "inline-block" }} />
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: T.ink0 }}>Fila Dev</h1>
        </div>
        <p style={{ marginTop: 6, fontSize: 12.5, color: T.ink1 }}>Entre com a sua conta da plataforma Product Ops.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" required autoFocus disabled={loading} style={field} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required disabled={loading} style={field} />
        </div>

        <button
          type="submit" disabled={loading}
          style={{ marginTop: 16, width: "100%", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 600, border: "none", cursor: loading ? "wait" : "pointer", background: "#5166e6", color: "#fff", opacity: loading ? 0.65 : 1, fontFamily: "'Inter Tight', sans-serif" }}
        >
          {loading ? "Verificando…" : "Entrar"}
        </button>

        {error && (
          <p className="inline-flex items-center" style={{ marginTop: 12, gap: 6, fontSize: 12, color: "#e08585" }}>
            <Lock size={12} /> {error}
          </p>
        )}
      </form>
    </div>
  );
}

/** Nada do app monta sem sessão: a tela de login substitui a casca inteira, em
    vez de aparecer por cima dela com o board já carregado atrás. */
function AuthGate({ children }) {
  const { T } = useTheme();
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: T.bg0, color: T.ink2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontFamily: "'Inter Tight', sans-serif" }}>
        Carregando…
      </div>
    );
  }
  if (status !== "authed") return <LoginScreen />;
  return children;
}

function AppShell() {
  const { T, theme, toggleTheme } = useTheme();
  const { syncFromSheet, lastSync, syncStatus } = useData();
  const { user, role, logout, canWriteShared } = useAuth();
  const [menu, setMenu] = useState("roadmap");

  return (
    <div style={{ minHeight: "100vh", background: T.bg0, color: T.ink0, fontFamily: "'Inter Tight', sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700&family=Inter+Tight:wght@400;500;600;700&display=swap');
        .pp-card:hover { background: ${T.bg2} !important; border-color: ${T.borderStrong} !important; }
        .pp-scroll::-webkit-scrollbar { height: 8px; }
        .pp-scroll::-webkit-scrollbar-thumb { background: ${T.border2}; border-radius: 999px; }
        .pp-spin { animation: pp-spin-anim 0.9s linear infinite; }
        @keyframes pp-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ borderBottom: `1px solid ${T.border1}`, padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, height: 46 }}>
        <div className="flex" style={{ alignItems: "center", gap: 4, height: 46 }}>
          {[["roadmap", "Roadmap", Calendar], ["semanal", "Semanal", TrendingUp], ["projetos", "Projetos", FolderKanban], ["tarefas", "Tarefas", ListChecks], ["analises", "Análises", BarChart3]].map(([key, label, Icon]) => {
            const active = menu === key;
            return (
              <button
                key={key}
                onClick={() => setMenu(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, height: 46, padding: "0 4px", marginBottom: -1,
                  borderBottom: active ? "2px solid #5166e6" : "2px solid transparent",
                  background: "none", border: "none", cursor: "pointer",
                  color: active ? T.ink0 : T.ink1, fontSize: 13, fontWeight: 500, fontFamily: "'Inter Tight', sans-serif",
                }}
              >
                <Icon size={14} /> {label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center" style={{ gap: 8 }}>
          {syncStatus === "error" && (
            <span style={{ fontSize: 11, color: "#e08585", fontFamily: "'Inter Tight', sans-serif" }}>
              {SHEET_SYNC_URL ? "Falha ao atualizar" : "Sincronização não configurada"}
            </span>
          )}
          {lastSync && syncStatus !== "error" && (
            <span style={{ fontSize: 11, color: T.ink2, fontFamily: "'Inter Tight', sans-serif" }}>
              Atualizado {fmtSyncTime(lastSync)}
            </span>
          )}
          {/* Puxar a planilha reescreve o board de todo mundo: só o super. */}
          {canWriteShared && (
            <button
              onClick={syncFromSheet} disabled={syncStatus === "loading"} title="Atualizar dados da planilha"
              style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, padding: "6px 10px", border: `1px solid ${T.border2}`, background: T.bg1, color: T.ink1, fontSize: 12, fontWeight: 500, cursor: syncStatus === "loading" ? "default" : "pointer", fontFamily: "'Inter Tight', sans-serif", opacity: syncStatus === "loading" ? 0.6 : 1 }}
            >
              <RefreshCw size={13} className={syncStatus === "loading" ? "pp-spin" : ""} />
              {syncStatus === "loading" ? "Atualizando…" : "Atualizar"}
            </button>
          )}
          <button
            onClick={toggleTheme}
            style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, padding: "6px 10px", border: `1px solid ${T.border2}`, background: T.bg1, color: T.ink1, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter Tight', sans-serif" }}
          >
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            {theme === "dark" ? "Modo claro" : "Modo escuro"}
          </button>
          <span
            title={user && user.email ? user.email : ""}
            style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, padding: "5px 9px", border: `1px solid ${T.border2}`, background: T.bg1, fontSize: 11.5, color: T.ink1, fontFamily: "'Inter Tight', sans-serif", maxWidth: 220 }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 999, background: T.bg2, color: T.ink0, fontSize: 9, fontWeight: 700, textTransform: "uppercase", flexShrink: 0 }}>
              {initials(user && (user.name || user.email))}
            </span>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user && (user.name || user.email)}
            </span>
            <span style={{ color: T.ink2, flexShrink: 0 }}>· {ROLE_LABEL[role] || "—"}</span>
          </span>
          <button
            onClick={logout} title="Sair"
            style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 8, padding: "6px 10px", border: `1px solid ${T.border2}`, background: T.bg1, color: T.ink1, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter Tight', sans-serif" }}
          >
            <LogOut size={13} /> Sair
          </button>
        </div>
      </div>

      {menu === "projetos" ? <ProjetosScreen /> : menu === "tarefas" ? <TarefasScreen /> : menu === "analises" ? <AnaliseScreen /> : menu === "semanal" ? <SemanalScreen /> : <RoadmapScreen />}
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const value = useMemo(() => ({ theme, toggleTheme, ...TOKENS[theme], palette: TOKENS[theme] }), [theme]);
  return (
    <ThemeCtx.Provider value={value}>
      <AuthProvider>
        <AuthGate>
          <DataProvider>
            <AppShell />
          </DataProvider>
        </AuthGate>
      </AuthProvider>
    </ThemeCtx.Provider>
  );
}
