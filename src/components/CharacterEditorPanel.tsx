import { useState } from 'react'
import { THEME } from '../constants'
import { AgentVisualTraits } from '../../types'
import { SKIN_TONES, HAIR_COLORS, OUTFIT_COLORS, HAT_STYLES, FACE_STYLES } from '../../constants'

interface CharacterEditorPanelProps {
  visible: boolean
  onClose: () => void
  agentName: string
  currentTraits: AgentVisualTraits
  onSave: (traits: AgentVisualTraits) => void
}

export function CharacterEditorPanel({ visible, onClose, agentName, currentTraits, onSave }: CharacterEditorPanelProps) {
  const [traits, setTraits] = useState<AgentVisualTraits>(currentTraits)
  const [activeTab, setActiveTab] = useState<'appearance' | 'outfit' | 'accessories'>('appearance')

  if (!visible) return null

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: '👤' },
    { id: 'outfit', label: 'Outfit', icon: '👕' },
    { id: 'accessories', label: 'Extras', icon: '🎩' },
  ] as const

  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        right: 16,
        width: 360,
        maxHeight: 'calc(100vh - 100px)',
        background: THEME.bgDark,
        border: `2px solid ${THEME.borderAccent}`,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        fontFamily: THEME.fontFamily,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          background: THEME.bgHeader,
          borderBottom: `1px solid ${THEME.borderPanel}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: THEME.textPrimary, fontWeight: 'bold', fontSize: 14 }}>
          ✏️ Edit: {agentName}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: THEME.textMuted,
            fontSize: 18,
            cursor: 'pointer',
          }}
        
003e
          ×
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: `1px solid ${THEME.borderPanel}`,
          background: THEME.bgBody,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 8px',
              background: activeTab === tab.id ? THEME.bgDark : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? `2px solid ${THEME.borderAccent}` : 'none',
              color: activeTab === tab.id ? THEME.textPrimary : THEME.textMuted,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: THEME.fontFamily,
            }}
          >
            <span style={{ marginRight: 4 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
        {activeTab === 'appearance' && (
          <div>
            <Section title="Skin Tone">
              <ColorGrid
                colors={SKIN_TONES}
                selected={traits.skinTone}
                onSelect={(color) => setTraits({ ...traits, skinTone: color })}
              />
            </Section>

            <Section title="Hair Color">
              <ColorGrid
                colors={HAIR_COLORS}
                selected={traits.hairColor}
                onSelect={(color) => setTraits({ ...traits, hairColor: color })}
              />
            </Section>

            <Section title="Hair Style">
              <OptionGrid
                options={[
                  { id: 0, label: 'Short', icon: '✂️' },
                  { id: 1, label: 'Spiky', icon: '🦔' },
                  { id: 2, label: 'Side Part', icon: '🎭' },
                  { id: 3, label: 'Bald', icon: '🥚' },
                  { id: 4, label: 'Long', icon: '💇' },
                  { id: 5, label: 'Mohawk', icon: '🐔' },
                  { id: 6, label: 'Ponytail', icon: '🎀' },
                  { id: 7, label: 'Curly', icon: '🌀' },
                ]}
                selected={traits.hairStyle}
                onSelect={(id) => setTraits({ ...traits, hairStyle: id })}
              />
            </Section>

            <Section title="Face">
              <OptionGrid
                options={[
                  { id: 'default', label: 'Normal', icon: '😐' },
                  { id: 'glasses', label: 'Glasses', icon: '👓' },
                  { id: 'beard', label: 'Beard', icon: '🧔' },
                  { id: 'both', label: 'Both', icon: '🤓' },
                  { id: 'freckles', label: 'Freckles', icon: '✨' },
                  { id: 'scar', label: 'Scar', icon: '⚔️' },
                ]}
                selected={traits.faceStyle}
                onSelect={(id) => setTraits({ ...traits, faceStyle: id })}
              />
            </Section>
          </div>
        )}

        {activeTab === 'outfit' && (
          <div>
            <Section title="Outfit Color">
              <ColorGrid
                colors={Object.values(OUTFIT_COLORS).filter((c) => typeof c === 'number') as number[]}
                selected={traits.outfitColor}
                onSelect={(color) => setTraits({ ...traits, outfitColor: color })}
              />
            </Section>
          </div>
        )}

        {activeTab === 'accessories' && (
          <div>
            <Section title="Hat">
              <OptionGrid
                options={[
                  { id: 'none', label: 'None', icon: '🚫' },
                  { id: 'cap', label: 'Cap', icon: '🧢' },
                  { id: 'beanie', label: 'Beanie', icon: '🎩' },
                  { id: 'tophat', label: 'Top Hat', icon: '🎩' },
                  { id: 'headband', label: 'Headband', icon: '👑' },
                  { id: 'bandana', label: 'Bandana', icon: '🏴‍☠️' },
                ]}
                selected={traits.hatStyle}
                onSelect={(id) => setTraits({ ...traits, hatStyle: id })}
              />
            </Section>

            <Section title="Accessory Color">
              <ColorGrid
                colors={HAIR_COLORS}
                selected={traits.accessoryColor ?? traits.hairColor}
                onSelect={(color) => setTraits({ ...traits, accessoryColor: color })}
              />
            </Section>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: 12,
          borderTop: `1px solid ${THEME.borderPanel}`,
          display: 'flex',
          gap: 8,
          background: THEME.bgBody,
        }}
      >
        <button
          onClick={() => setTraits(currentTraits)}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'transparent',
            border: `1px solid ${THEME.borderPanel}`,
            color: THEME.textMuted,
            fontFamily: THEME.fontFamily,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
        <button
          onClick={() => {
            onSave(traits)
            onClose()
          }}
          style={{
            flex: 2,
            padding: '8px 12px',
            background: THEME.borderAccent,
            border: 'none',
            color: THEME.textBright,
            fontFamily: THEME.fontFamily,
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}

// Sub-components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          color: THEME.textMuted,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function ColorGrid({
  colors,
  selected,
  onSelect,
}: {
  colors: number[]
  selected: number
  onSelect: (color: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          style={{
            width: 32,
            height: 32,
            background: `#${color.toString(16).padStart(6, '0')}`,
            border: selected === color ? `3px solid ${THEME.textBright}` : '2px solid transparent',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        />
      ))}
    </div>
  )
}

function OptionGrid({
  options,
  selected,
  onSelect,
}: {
  options: Array<{ id: string | number; label: string; icon: string }>
  selected: string | number
  onSelect: (id: string | number) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          style={{
            padding: '8px 4px',
            background: selected === opt.id ? THEME.borderAccent : THEME.bgBody,
            border: `1px solid ${selected === opt.id ? THEME.borderAccent : THEME.borderPanel}`,
            borderRadius: 4,
            color: selected === opt.id ? THEME.textBright : THEME.textPrimary,
            fontSize: 11,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 20 }}>{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
