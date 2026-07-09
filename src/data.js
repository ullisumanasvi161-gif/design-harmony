import {
  Armchair,
  BedDouble,
  Blocks,
  BriefcaseBusiness,
  ChefHat,
  Cuboid,
  House,
  LampCeiling,
  PanelsTopLeft,
  Ruler,
  Sparkles,
  WalletCards
} from "lucide-react";

export const services = [
  {
    icon: House,
    number: "01",
    title: "Complete Home Interiors",
    copy: "One cohesive language across every room—from spatial planning to the last styled detail.",
    image: "/services/complete-home.webp"
  },
  {
    icon: ChefHat,
    number: "02",
    title: "Modular Kitchens",
    copy: "Ergonomic kitchens engineered around the way your family cooks, gathers and lives.",
    image: "/services/modular-kitchen.webp"
  },
  {
    icon: Armchair,
    number: "03",
    title: "Living Rooms",
    copy: "Layered, inviting spaces composed through proportion, light, art and tactile materials.",
    image: "/services/living-room.webp"
  },
  {
    icon: BedDouble,
    number: "04",
    title: "Bedrooms",
    copy: "Quiet, personal retreats with considered storage, lighting and tailored soft furnishings.",
    image: "/services/bedroom.webp"
  },
  {
    icon: PanelsTopLeft,
    number: "05",
    title: "Wardrobes & Storage",
    copy: "Architectural storage systems that make daily routines feel beautifully effortless.",
    image: "/services/wardrobe-storage.webp"
  },
  {
    icon: LampCeiling,
    number: "06",
    title: "Ceilings & Lighting",
    copy: "Thoughtful light layers and refined ceiling details that shape mood without visual noise.",
    image: "/services/ceilings-lighting.webp"
  },
  {
    icon: BriefcaseBusiness,
    number: "07",
    title: "Office Interiors",
    copy: "Human-centred workplaces that support focus, culture and an elevated brand presence.",
    image: "/services/office-interiors.webp"
  },
  {
    icon: Cuboid,
    number: "08",
    title: "3D Visualization",
    copy: "Immersive design previews that let you experience materials, scale and light before execution.",
    image: "/services/visualization-3d.webp"
  },
  {
    icon: Blocks,
    number: "09",
    title: "Turnkey Projects",
    copy: "A single accountable team for design, procurement, site execution and final handover.",
    image: "/services/turnkey-projects.webp"
  }
];

export const projects = [
  {
    title: "Aurelia Residence",
    category: "Complete Home",
    location: "Manikonda, Hyderabad",
    budget: "₹25–35L",
    status: "Completed",
    image: "/hero-interior.png",
    metric: "3,200 sq ft"
  },
  {
    title: "Serein Kitchen",
    category: "Modular Kitchen",
    location: "Kokapet, Hyderabad",
    budget: "₹8–12L",
    status: "Completed",
    image: "/kitchen.png",
    metric: "420 sq ft"
  },
  {
    title: "Nocturne Suite",
    category: "Bedroom",
    location: "Jubilee Hills, Hyderabad",
    budget: "₹10–15L",
    status: "Completed",
    image: "/bedroom.png",
    metric: "680 sq ft"
  },
  {
    title: "Atelier One",
    category: "Office",
    location: "Financial District",
    budget: "₹35–50L",
    status: "Completed",
    image: "/office.png",
    metric: "4,800 sq ft"
  }
];

export const process = [
  { number: "01", title: "Discover", copy: "We listen, measure and understand the rituals your space needs to support.", icon: Ruler },
  { number: "02", title: "Imagine", copy: "Plans, palettes and 3D previews turn possibilities into a clear design direction.", icon: Sparkles },
  { number: "03", title: "Build", copy: "Our site team executes with transparent milestones and rigorous quality checks.", icon: Blocks },
  { number: "04", title: "Belong", copy: "We style, hand over and remain available as your new space settles around you.", icon: WalletCards }
];

export const company = {
  name: "Design Harmony",
  owner: "K. Krishna Chaitanya",
  phones: ["7013162157", "8977527728"],
  email: "designharmony@gmail.com",
  address: "Flat No. 402, Strawberry Apartments, Manikonda, Hyderabad, Telangana – 500089"
};
