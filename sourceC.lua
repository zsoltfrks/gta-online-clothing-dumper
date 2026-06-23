-- /dumpcloth <all|slot>
--
-- Enumerates every drawable variation of a clothing slot for the local ped and
-- ships the list to the server, which writes it to dump_<gender>/.
--
-- Drawable counts change with every GTA Online DLC, so this reads them straight
-- from the *running* game build rather than relying on a hard-coded list.

local FEMALE_MODEL = `mp_f_freemode_01` -- compile-time joaat hash

-- GTA component/prop indices for each wearable slot.
local SLOTS = {
    { key = 'tops',        type = 'component', id = 11 },
    { key = 'undershirts', type = 'component', id = 8 },
    { key = 'torsos',      type = 'component', id = 3 },
    { key = 'legs',        type = 'component', id = 4 },
    { key = 'shoes',       type = 'component', id = 6 },
    { key = 'accessories', type = 'component', id = 7 },
    { key = 'masks',       type = 'component', id = 1 },
    { key = 'hats',        type = 'prop',      id = 0 },
    { key = 'glasses',     type = 'prop',      id = 1 },
    { key = 'ears',        type = 'prop',      id = 2 },
    { key = 'watches',     type = 'prop',      id = 6 },
    { key = 'bracelets',   type = 'prop',      id = 7 },
}

local function variationCount(ped, slot)
    if slot.type == 'prop' then
        return GetNumberOfPedPropDrawableVariations(ped, slot.id)
    end
    return GetNumberOfPedDrawableVariations(ped, slot.id)
end

local function dumpSlot(ped, gender, slot)
    local count = variationCount(ped, slot)
    local entries = {}
    for drawable = 0, count - 1 do
        entries[#entries + 1] = {
            id = ('%s_%d'):format(slot.key, drawable),
            drawable = drawable,
            texture = 0,
        }
    end
    TriggerServerEvent('clothing-dumper:save', gender, slot.key, entries)
    print(('dumpcloth: %s/%s -> %d drawables'):format(gender, slot.key, count))
end

local function slotKeyList()
    local keys = {}
    for _, slot in ipairs(SLOTS) do keys[#keys + 1] = slot.key end
    return table.concat(keys, '|')
end

RegisterCommand('dumpcloth', function(_, args)
    local ped = PlayerPedId()
    local gender = GetEntityModel(ped) == FEMALE_MODEL and 'female' or 'male'
    local target = (args[1] or 'all'):lower()

    if target == 'all' then
        for _, slot in ipairs(SLOTS) do
            dumpSlot(ped, gender, slot)
        end
        return
    end

    for _, slot in ipairs(SLOTS) do
        if slot.key == target then
            dumpSlot(ped, gender, slot)
            return
        end
    end

    print('usage: /dumpcloth <all|' .. slotKeyList() .. '>')
end, false)
