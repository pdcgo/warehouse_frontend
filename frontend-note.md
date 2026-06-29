

# mode warehouse team plan
we are focus on frontend first and we implemeent proto and backend later

## Menu Home
1. create this
2. for this just contain welcome
3. this menu live in all mode team

## Menu Product
### Product Detail
1. General Info in Product Detail
    - product name
    - images
    - product team owner
    - Sku
2. Stock Info
    - Ready Stock Count
    - Ready Stock Amount
    - Ongoing Stock Count
    - Ongoing Stock Amount

3. Last Restock Info
    - Supplier
    - last restock created
    - last restock accepted
    - quantity & amount

3. Last Return Info
    - last Return created
    - last Return accepted
    - quantity & amount

5. Have few Tab:
    - "Placements", summary product that places in where.
    - "Stock Hstory" flow of change stock that happened.
    - "Price" that inform ready quantity and amount of grouped price.
    - "Batch" contain list of batch product in warehouse. its have detail
        - when its created 
        - init count & amount
        - ready count & amount
        - who create it
        


## Menu Inventory

### Submenu Placement
1. Placement detail.
    placement detail have tab:
        - placement history
        - product
        - Opname History

2. data must have in placement list.
    Basic Info:
    - name
    - created

    Contain Info:
    - item count
    - product count

    Opname Info:
    - last opname
    - last opname by who

### Submenu Opname
    

## Menu Inbound
1. add submenu Restock and Return
    plan list and detail related of that
2. each Restock and Return have tabbed status "Pending", "Accepted", and "Problem"


## Menu Order
remove menu Outbound and replace to menu "Order"

## Menu Setting

1. Add General User Info
2. Add change phone number feature

## Menu Balance (exist in selling and warehouse)
that contain payable and receivable.

## Menu Team
1. create this new menu.
2. this menu contains list of team.
3. team can be searchable
4. team have detail, detail that have is:
    - General Info
    - User List of that team, add feature to remove and add it
5. this menu lived in mode Root Team and Admin Team

## Menu User
1. change name menu user to "My User"

## Menu All User
1. create this menu with name "All User"
2. this menu contains all user 
3. user can be searchable
4. user can be filtered by team, team selector is all
5. if backend not implemented properly just mock it
6. this menu lived in mode Root Team and Admin Team



# Components Related
## Popup
scan all available component popup.
1. its used chakra ui component properly ? for popup use chakra ui dialog
2. for closing dialog, add icon x in top right and cancel button

## Team Selector (in sidebar menu)
1. in popup make it can be searchable





# Standarize Shared Component plan
its used to curated all shareable component we have.
please remember it, if i create, modify or plan a sharable components, write it to warehouse_frontend/docs/shareable_components.md so its make you easier to understand the context and getting bigger picture for reusing that component.

## Team Picker
1. Team Picker have two flavor
    - just select
    - select and in left select type, warehouse or selling or admin, and type is configurable in code/property of component
    - warehouse select

## User Picker
1. create shareable user picker
2. make it can be scoped to spesific team or all, its configure with properties
3. in list item, make it more ui/ux friendly by add avatar/ image and name

## Role Picker
1. create shareable role picker
2. make it can be scoped to spesific team or all, its configure with properties


## Shipping Picker
plan and Create shareable component of Shipping Picker and curated in component page



lets discuss about standarize button and input for better ui/ux.
creating hardrule for frontend about this.
question:
1. its using chankra/ui component properly ?
2. is input and button to big for our ui ?

