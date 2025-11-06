<template>
  <div class="py-8">
    <h2 class="text-3xl font-bold text-primary mb-6">UK Farming Guide</h2>
    
    <div class="bg-white dark:bg-gray-800 rounded-card p-8 max-w-4xl space-y-6 border-2 border-gray-200 dark:border-gray-700">
      <section>
        <h3 class="text-2xl font-bold text-primary mb-3">British Four-Year Crop Rotation</h3>
        <p class="text-text/80 mb-4">
          Traditional UK crop rotation helps maintain soil health, reduce pests, and maximise yields. 
          A typical four-year rotation for arable farming in Britain follows this pattern:
        </p>
        <ol class="list-decimal list-inside space-y-2 text-text/80">
          <li><strong>Year 1:</strong> Wheat or another cereal crop</li>
          <li><strong>Year 2:</strong> Oilseed rape or another break crop</li>
          <li><strong>Year 3:</strong> Barley or spring cereal</li>
          <li><strong>Year 4:</strong> Beans, peas, or another legume</li>
        </ol>
      </section>

      <section>
        <h3 class="text-2xl font-bold text-primary mb-3">Common UK Crops</h3>
        <div class="grid md:grid-cols-2 gap-4">
          <div class="border border-primary/20 rounded-lg p-4">
            <h4 class="font-bold text-primary mb-2">Cereals</h4>
            <ul class="list-disc list-inside text-text/80">
              <li>Winter Wheat</li>
              <li>Spring Barley</li>
              <li>Oats</li>
              <li>Winter Barley</li>
            </ul>
          </div>
          <div class="border border-primary/20 rounded-lg p-4">
            <h4 class="font-bold text-primary mb-2">Break Crops</h4>
            <ul class="list-disc list-inside text-text/80">
              <li>Oilseed Rape</li>
              <li>Field Beans</li>
              <li>Peas</li>
              <li>Linseed</li>
            </ul>
          </div>
          <div class="border border-primary/20 rounded-lg p-4">
            <h4 class="font-bold text-primary mb-2">Vegetables</h4>
            <ul class="list-disc list-inside text-text/80">
              <li>Potatoes</li>
              <li>Onions</li>
              <li>Carrots</li>
              <li>Brassicas</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 class="text-2xl font-bold text-primary mb-3">Livestock Management</h3>
        <p class="text-text/80 mb-3">
          British farms often combine arable and livestock for diversification:
        </p>
        <ul class="list-disc list-inside space-y-1 text-text/80">
          <li><strong>Cattle:</strong> Beef and dairy breeds suited to UK climate</li>
          <li><strong>Sheep:</strong> Hardy breeds for upland and lowland grazing</li>
          <li><strong>Pigs:</strong> Indoor and outdoor systems</li>
          <li><strong>Poultry:</strong> Free-range and barn systems</li>
        </ul>
      </section>

      <section>
        <h3 class="text-2xl font-bold text-primary mb-3">Seasonal Calendar</h3>
        <div class="space-y-3">
          <div class="border-l-4 border-primary pl-4">
            <h4 class="font-bold text-primary">Autumn (September - November)</h4>
            <p class="text-text/80">Sow winter wheat and barley, harvest late crops, plough stubble</p>
          </div>
          <div class="border-l-4 border-primary pl-4">
            <h4 class="font-bold text-primary">Winter (December - February)</h4>
            <p class="text-text/80">Maintenance, planning, livestock care, drainage work</p>
          </div>
          <div class="border-l-4 border-primary pl-4">
            <h4 class="font-bold text-primary">Spring (March - May)</h4>
            <p class="text-text/80">Sow spring crops, fertilise winter crops, lambing, calving</p>
          </div>
          <div class="border-l-4 border-primary pl-4">
            <h4 class="font-bold text-primary">Summer (June - August)</h4>
            <p class="text-text/80">Harvest cereals, make hay and silage, spray for weeds and pests</p>
          </div>
        </div>
      </section>

      <section>
        <h3 class="text-2xl font-bold text-primary mb-3">British Weather Considerations</h3>
        <p class="text-text/80">
          The UK's temperate maritime climate means mild winters, cool summers, and rainfall throughout the year. 
          Plan for wet conditions during autumn and winter, be prepared for late frosts in spring, and take 
          advantage of long summer daylight hours for efficient harvesting.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
