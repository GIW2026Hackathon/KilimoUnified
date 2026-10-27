# Software Requirements Specification

## Predictive Climate & Fodder Advisor AI

**Version:** 1.0 — Hackathon MVP  
**Project type:** AI-assisted dairy farming decision-support system  
**Target users:** Kenyan smallholder dairy farmers

## 1. Project overview

Smallholder dairy farmers often react to drought after pasture has declined, leading to feed shortages, expensive emergency purchases, reduced milk production, and lower profits. This application helps farmers anticipate dry conditions, estimate feed shortages and financial losses, and receive practical recommendations for managing fodder and feed costs.

Objectives:

- Display climate-risk information for a farm's location.
- Estimate potential feed shortages using basic farm data.
- Calculate possible milk-revenue losses and feed intervention costs.
- Recommend practical preventive actions.

## 2. Scope

The MVP includes a simple farm profile, weather integration, climate-risk assessment, basic feed-deficit estimation, financial impact calculation, rule-based fodder and feed recommendations, and a simple dashboard.

Out of scope: training a custom machine-learning model; SMS or USSD; mobile money; complex livestock nutrition optimization; full farm accounting or inventory management; multiple user roles and advanced reporting.

## 3. Users

- **Farmer:** Enters farm information, views climate risk, checks estimated losses, and receives recommendations.
- **Development team:** Builds and maintains the application.

A single farmer profile or demonstration dataset is sufficient for a hackathon demonstration.

## 4. Functional requirements

| ID | Requirement |
|---|---|
| FR-01 | Allow entry of farm location, herd size, and average daily milk production. |
| FR-02 | Retrieve weather information for the selected location using an available weather API. |
| FR-03 | Display Low, Moderate, or High climate risk based on documented rules or forecast indicators. |
| FR-04 | Allow entry of available feed quantity, estimated daily feed requirement, milk price, and feed price. |
| FR-05 | Estimate feed deficit over a selected period. |
| FR-06 | Estimate potential milk-revenue loss using clearly stated assumptions. |
| FR-07 | Estimate the cost of purchasing additional feed. |
| FR-08 | Recommend actions such as planting suitable fodder, conserving feed, or purchasing feed early. |
| FR-09 | Display climate risk, feed status, estimated financial impact, and recommended actions on a dashboard. |

## 5. Business logic

- **Feed deficit:** `max(0, feed required − usable feed available)`.
- **Estimated daily milk revenue:** `daily milk production × price per litre`.
- **Potential revenue loss:** `baseline revenue − estimated revenue under a feed-shortage scenario`. Any production reduction must be an explicit assumption or come from a validated method.
- **Additional feed cost:** `feed deficit × price per unit of feed`. Quantity and price must use compatible units; feed should ideally use kilograms of dry matter.
- Recommendations use simple rules. For example, high risk with enough planting time may prompt locally suitable drought-resilient fodder; high risk with little planting time may prompt conservation and early-purchase planning; low stocks may prompt shortfall budgeting. Recommendations must consider local agronomic suitability rather than assume one crop works everywhere.

## 6. Non-functional requirements

- **Usability:** Simple, mobile-friendly dashboard.
- **Performance:** Main dashboard loads quickly under normal conditions.
- **Reliability:** Handle weather API failures gracefully.
- **Validation:** Check numerical inputs for invalid or missing values.
- **Transparency:** Show assumptions behind estimated losses and risk categories.
- **Security:** If accounts exist, protect private farm records.

## 7. Proposed technology

Frontend: HTML/CSS/Bootstrap or React. Backend: Django. Database: SQLite for a prototype. Weather: Open-Meteo or another suitable provider. Risk assessment: transparent rules and available climate indicators. Financial calculations: Python. A custom ML model is not required.

## 8. Minimum data entities

1. **Farm:** Location, herd size, average daily milk production, and milk price.
2. **FeedRecord:** Feed type, available quantity, estimated daily requirement, and unit price.
3. **RiskAssessment:** Assessment date, climate-risk category, estimated feed deficit, estimated financial impact, and recommendations.

Weather may be fetched when needed rather than stored separately.

## 9. MVP acceptance criteria

1. A user can enter basic farm information.
2. The system can retrieve or display suitable climate information.
3. The system can classify climate risk using documented logic.
4. The system calculates feed deficit from sample inputs.
5. The system estimates additional feed costs and potential revenue loss.
6. The system generates at least one relevant mitigation recommendation.
7. The dashboard displays the results clearly.

## 10. Hackathon deliverable

Demonstrate the complete flow: **Farm information → Climate risk → Feed deficit → Financial impact → Recommended action.** The prototype should demonstrate how acting before a feed shortage may help manage costs and protect milk production. Projected savings are estimates, not guarantees.

## 11. Future improvements

Possible future work includes historical climate analysis, validated drought-prediction models, regional feed-price data, SMS alerts, user accounts, and more detailed feed planning.
