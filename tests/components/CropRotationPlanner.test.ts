import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CropRotationPlanner from '../../src/components/CropRotationPlanner.vue'

describe('CropRotationPlanner Component', () => {
  it('should suggest break crop when current crop is Wheat', async () => {
    const wrapper = mount(CropRotationPlanner)

    // Select Wheat
    const select = wrapper.find('select')
    await select.setValue('Wheat')

    // Click suggestion button
    const button = wrapper.find('button')
    await button.trigger('click')

    // Check suggestion
    const suggestionText = wrapper.text()
    expect(suggestionText).toContain('Oilseed Rape or Field Beans')
    expect(suggestionText).toContain('Break crops after cereals')
  })

  it('should suggest legumes after Barley', async () => {
    const wrapper = mount(CropRotationPlanner)

    const select = wrapper.find('select')
    await select.setValue('Barley')

    const button = wrapper.find('button')
    await button.trigger('click')

    const suggestionText = wrapper.text()
    expect(suggestionText).toContain('Peas or Field Beans')
    expect(suggestionText).toContain('Legumes fix nitrogen')
  })

  it('should disable button when no crop selected', () => {
    const wrapper = mount(CropRotationPlanner)

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
  })
})
