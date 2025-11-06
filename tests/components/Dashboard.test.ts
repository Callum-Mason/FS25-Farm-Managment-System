import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Dashboard from '../../src/views/Dashboard.vue'
import { createRouter, createMemoryHistory } from 'vue-router'

describe('Dashboard Component', () => {
  it('should render all six main buttons', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: Dashboard },
        { path: '/app/fields', component: { template: '<div>Fields</div>' } },
        { path: '/app/crops', component: { template: '<div>Crops</div>' } },
        { path: '/app/money', component: { template: '<div>Money</div>' } },
        { path: '/app/animals', component: { template: '<div>Animals</div>' } },
        { path: '/app/guide', component: { template: '<div>Guide</div>' } },
        { path: '/app/equipment', component: { template: '<div>Equipment</div>' } }
      ]
    })

    const wrapper = mount(Dashboard, {
      global: {
        plugins: [router]
      }
    })

    const buttons = wrapper.findAll('a')
    expect(buttons.length).toBe(6)
    
    const buttonTexts = buttons.map(b => b.text())
    expect(buttonTexts).toContain('Field Tracker')
    expect(buttonTexts).toContain('Crop Rotation')
    expect(buttonTexts).toContain('Money Tracker')
    expect(buttonTexts).toContain('Animals')
    expect(buttonTexts).toContain('UK Guide')
    expect(buttonTexts).toContain('Equipment')
  })
})
